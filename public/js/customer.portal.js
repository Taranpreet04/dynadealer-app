document.addEventListener("DOMContentLoaded", () => {
    console.log("my js file for ")
    let serverPath = "https://disable-ladder-submitting-filter.trycloudflare.com";
    const url = new URL(window.location.href);
    const customerId = url.searchParams.get("cid");
    let shop = Shopify.shop;

    let subscriptionDetails = []
    let tableData = []
    let contractDetailShopify = ''
    let contractDetailDb = ''
    let selectedSubscription = {}
    let totalPlans = 0
    let totalPages = 0
    let currentPage = 1
    let canCancelSubscription = false;
    let mainDIv = document.getElementById('subscription-main-body')
    let contentDiv = document.createElement('div');
    contentDiv.id = 'main-content'
    let toastDiv = document.createElement('div');
    toastDiv.innerHTML = '<div id="snackbar"></div>';
    mainDIv.appendChild(contentDiv)
    mainDIv.appendChild(toastDiv)

    function capitalize(str) {
        return str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase();
    }
    function getCurrencySymbol(currencyCode) {
        const currencySymbols = {
            INR: "₹",  // Indian Rupee
            USD: "$",  // US Dollar
            EUR: "€",  // Euro
            GBP: "£",  // British Pound
            JPY: "¥",  // Japanese Yen
            CNY: "¥",  // Chinese Yuan
            AUD: "A$", // Australian Dollar
            CAD: "C$", // Canadian Dollar
        };
        // if(currencyCode){
        return currencySymbols[currencyCode?.toUpperCase() || "USD"] || `Symbol not found for ${currencyCode}`;
        // }else{
        //     return currencySymbols[Shopify?.currrency?.active] || `Symbol not found for ${currencyCode}`;
        // }

    }

    let currencySymbol = getCurrencySymbol(Shopify?.currrency?.active || 'USD')
    console.log(getCurrencySymbol(Shopify?.currrency?.active));
    let tableStructure = `<table>
        <thead class='sub-table-head'>
            <tr>
                <td>Order Id</td>
                <td>Customer Name</td>
                <td>Purchase Type</td>
                <td>Entries/per cycle</td>
                <td>Status</td>
                <td>Created Date</td>
                <td>View Details</td>
            </tr>
        </thead>
        <tbody id="sub-row">
            
        </tbody>
    </table>`

    let modalContentToCancel = `<div class="modal-content">
                    <span class="close">&times;</span>
                    <h3 id='cancelModalHead'>Cancel Subscription Plan</h3>
                    <div id='cancelModalBody'>
                        <p>Are you sure you want to cancel this plan?</p>
                    <div>
                    </div id='cancelModalfooter'>
                        <button class="yesBtn btn" id="yesBtn">YES</button>
                        <button class="closeBtn btn" id="closeBtn">NO</button>
                    </div>
                </div>`
    let modalContentToAlert = `<div class="modal-content">
                    <span class="close">&times;</span>
                    <h3 id='cancelModalHead'>Alert!</h3>
                    <div id='cancelModalBody'>
                        <p>Sorry, you are not able to cancel subscription as your minimum subscription cycles are not completed.</p>
                    <div>
                    </div id='cancelModalfooter'>
                        <button class="yesBtn btn" id="okBtn">Ok</button>
                    </div>
                </div>`
    const loaderStart = () => {
        contentDiv.innerHTML = ''
        let loaderDiv = document.createElement('div');
        loaderDiv.id = "loader"
        contentDiv.appendChild(loaderDiv)
    }
    async function main() {
        async function getSubscriptions() {
            try {
                loaderStart();
                const response = await fetch(
                    `${serverPath}/api/getCustomerSubscriptions`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        // body: JSON.stringify({ cid: 22313014296870 }),
                        body: JSON.stringify({ cid: customerId }),
                    }
                );

                const result = await response.json();
                if (result.message == "success") {
                    totalPlans = 0;
                    totalPages = 0;
                    currentPage = 1;
                    subscriptionDetails = result?.details;

                    totalPlans = subscriptionDetails.length;
                    if (totalPlans % 10 == 0) {
                        totalPages = totalPlans / 10
                    } else {
                        totalPages = parseInt((totalPlans / 10)) + 1;
                    }
                    tableData = subscriptionDetails.slice(0, 10)
                    loaderStop();
                    showListData();
                }
            } catch (error) {
                loaderStop();
                console.error("Error:", error);
            }
        }
        loaderStart();
        await getSubscriptions();
    }
    main();
    const manageFooterBtns = () => {
        let nextBtn = document.getElementById('nextBtn')
        let prevBtn = document.getElementById('prevBtn')
        currentPage == 1 ? prevBtn.disabled = true : prevBtn.disabled = false;
        currentPage == totalPages ? nextBtn.disabled = true : nextBtn.disabled = false;
    }

    function showToast(text) {
        var x = document.getElementById("snackbar");
        x.innerText = text
        x.className = "show";
        setTimeout(function () { x.className = x.className.replace("show", ""); }, 7000);
    }
    function formatISOToDate(isoDate) {
        const date = new Date(isoDate);
        return date.toISOString().split('T')[0]; // Extracts YYYY-MM-DD
    }
    function getEntries(planName) {
        return planName.split('-entries-')[1]

    }

    const getContractDetails = async (id, show = false) => {
        try {
            loaderStart();
            const response = await fetch(
                `${serverPath}/api/getContractDetails`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ contractId: `gid://shopify/SubscriptionContract/${id}`, shop: shop }),
                }
            );

            const result = await response.json();
            if (result.message == "success") {
                contractDetailShopify = result?.data?.subscriptionContract;
                currencyCode = contractDetailShopify?.lines?.edges[0]?.node?.currentPrice?.currencyCode
                currencySymbol = getCurrencySymbol(contractDetailShopify?.lines?.edges[0]?.node?.pricingPolicy?.cycleDiscounts[0]?.adjustmentValue?.currencyCode)
                loaderStop();
                showDetailedData()
                if (show) {
                    showToast("Your membership cancelled successfully.")
                }
            } else {
                loaderStop();
                showDetailedData()
                //something went wrong show
            }
        } catch (error) {
            loaderStop();
            console.error("Error:", error);
        }
    }

    const cancelStatus = async () => {
        try {
            loaderStart();
            let data = {
                ...contractDetailShopify,
                status: "CANCELLED",
                contractDbID: selectedSubscription?._id,
                shop: selectedSubscription?.shop
            }
            const response = await fetch(
                `${serverPath}/api/cancelContract`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                }
            );

            const result = await response.json();
            if (result.message == "success") {
                loaderStop();
                getContractDetails(selectedSubscription?.contractId, true)
            }
        } catch (error) {
            loaderStop();
            console.error("Error:", error);
        }
    }
    const checkCancelPossible = async () => {
        try {
            const response = await fetch(
                `${serverPath}/api/checkCancel`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(selectedSubscription?.contractId),
                }
            );

            const result = await response.json();
            if (result.message == "success") {
                console.log("result?.details==", result?.details)
                contractDetailDb = result?.details
                if (contractDetailDb?.length >= selectedSubscription?.billing_policy?.min_cycles) {
                    canCancelSubscription = true;
                } else {
                    canCancelSubscription = false;
                }
            }
        } catch (error) {
            loaderStop();
            console.error("Error:", error);
        }
    }
    const applyTickets = async (item) => {
        try {
            let data = { ...item, applied: true }
            const response = await fetch(
                `${serverPath}/api/appliedTickets`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                }
            );

            const result = await response.json();
            if (result.message == "success") {
                console.log("result?.details==", result?.details)
                let applyBtn = document.getElementById(`${item?._id}`)
                console.log("applyBtn== check id", applyBtn)
                applyBtn.disabled = true
                applyBtn.innerText = 'Applied'
                showToast("Successfully applied for the current giveaway.")
                // contractDetailDb= result?.details
                // if (contractDetailDb?.length >= selectedSubscription?.billing_policy?.min_cycles) {
                //     canCancelSubscription = true;
                // } else {
                //     canCancelSubscription = false;
                // }
            }
        } catch (error) {
            loaderStop();
            console.error("Error:", error);
        }
    }

    const generateRows = () => {
        let tbody = document.getElementById("sub-row")
        tbody.innerHTML = ''
        console.log("tableData=", tableData)
        tableData?.map((item, index) => {
            let tr = document.createElement('tr');
            tr.id = item?.contractId
            tbody.appendChild(tr)
            let planIdCell = document.createElement('td');
            planIdCell.innerText = item.orderId;
            let nameCell = document.createElement('td');
            nameCell.innerText = capitalize(item.customerName);
            let purchaseTypeCell = document.createElement('td');
            purchaseTypeCell.innerText = capitalize(item.billing_policy?.interval)
            let entriesCell = document.createElement('td');
            entriesCell.innerText = getEntries(item?.sellingPlanName)
            let statusCell = document.createElement('td');
            statusCell.innerText = capitalize(item.status)
            if (item.status == 'CANCELLED') {
                statusCell.style.color = 'red';
            }
            let dateCell = document.createElement('td');
            dateCell.innerText = formatISOToDate(item.createdAt)
            let actionCell = document.createElement('td');
            let link = document.createElement('a');
            link.href = "#";
            link.innerHTML = `<svg class="eye-svg w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="white" stroke-width="1" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"/>
  <path stroke="white" stroke-width="1" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
</svg>`;
            link.onclick = async () => {
                selectedSubscription = item;
                await checkCancelPossible()
                await getContractDetails(item?.contractId)
            };
            actionCell.appendChild(link);
            tbody.appendChild(tr)
            tr.appendChild(planIdCell)
            tr.appendChild(nameCell)
            tr.appendChild(purchaseTypeCell)
            tr.appendChild(entriesCell)
            tr.appendChild(statusCell)
            tr.appendChild(dateCell)
            tr.appendChild(actionCell)
        })
    }
    const updateTableData = () => {
        let skip = (currentPage - 1) * 10
        tableData = subscriptionDetails.slice(skip, parseInt(10) + skip)
        generateRows()
        let footer = document.getElementById('subscription-footer')
        if (footer) {
            manageFooterBtns();
            let pageDetail = document.getElementById('pagination-detail')
            pageDetail.innerText = `Showing ${currentPage} page of ${totalPages} page`
        }
    }
    const handleNextBtn = () => {
        if (currentPage != totalPages) {
            currentPage = currentPage + 1;
            updateTableData()
        }
    }
    const handlePrevBtn = () => {
        if (currentPage != 1) {
            currentPage = currentPage - 1;
            updateTableData()
        }
    }
    const generateProductRows = () => {
        let tbody = document.getElementById("product-row")
        let products = contractDetailShopify?.lines?.edges
        products?.map((item, index) => {
            let tr = document.createElement('tr');
            tr.id = index
            tbody.appendChild(tr)
            let productCell = document.createElement('td');
            productCell.id = "title-img"
            let priceCell = document.createElement('td');
            priceCell.innerText = `${currencySymbol}${item?.node?.pricingPolicy?.cycleDiscounts[0]?.adjustmentValue?.amount}`
            let entriesCell = document.createElement('td');
            entriesCell.innerText = `${(item?.node?.sellingPlanName?.split('-entries-')[1]) * (item?.node?.quantity)}`
            let totalCell = document.createElement('td');
            totalCell.innerText = `${currencySymbol}${(item?.node?.pricingPolicy?.cycleDiscounts[0]?.adjustmentValue?.amount * item?.node?.quantity).toFixed(2)}`
            tbody.appendChild(tr)
            tr.appendChild(productCell)
            tr.appendChild(priceCell)
            tr.appendChild(entriesCell)
            tr.appendChild(totalCell)
            let imgDiv = document.createElement('img');
            imgDiv.src = item?.node?.variantImage?.url
            imgDiv.height = 50
            imgDiv.width = 50
            let p = document.createElement('p');
            p.innerText = item?.node?.title
            productCell.appendChild(imgDiv)
            productCell.appendChild(p)
        })

        let footer = document.getElementById("contract-footer")
        let status = contractDetailShopify?.status?.toLowerCase()
        if (status == "active") {
            let btnDiv = document.createElement('div');
            btnDiv.id = "cancelBtnDiv";
            let btn = document.createElement('button');
            btn.innerText = "cancel"
            btn.id = "cancelBtn"
            btn.className = "btn"
            btnDiv.appendChild(btn)
            footer.appendChild(btnDiv)


            let modal = document.createElement('div');
            modal.id = "myModal";
            modal.className = "modal"
            if (canCancelSubscription) {

                modal.innerHTML = modalContentToCancel
            } else {
                modal.innerHTML = modalContentToAlert
            }

            footer.appendChild(modal)

            var span = document.getElementsByClassName("close")[0];

            btn.onclick = function () {
                modal.style.display = "block";
            }

            span.onclick = function () {
                modal.style.display = "none";
            }

            let yesBtn = document.getElementById("yesBtn")
            let closeBtn = document.getElementById("closeBtn")
            let okBtn = document.getElementById("okBtn")

            if (okBtn) {
                okBtn.onclick = function () {
                    modal.style.display = "none";
                }
            }
            if (closeBtn) {
                closeBtn.onclick = function () {
                    modal.style.display = "none";
                }
            }
            if (yesBtn) {
                yesBtn.onclick = function () {
                    modal.style.display = "none";
                    cancelStatus()
                }
            }
        } else {
            footer.remove()
        }
    }
    const generateTicketsrow = () => {
        let tbody = document.getElementById("ticket-listing-row")
        // let products = contractDetailShopify?.lines?.edges
        contractDetailDb?.map((item, index) => {
            console.log("item=", item)
            let tr = document.createElement('tr');
            tr.id = index
            tbody.appendChild(tr)
            let ticketIdsCell = document.createElement('td');
            ticketIdsCell.id = "ticketIds"
            ticketIdsCell.colSpan = 2;
            let content = item?.drawIds.join(', ')
            console.log("content=", content)
            ticketIdsCell.innerText = content
            let dateCell = document.createElement('td');
            dateCell.innerText = formatISOToDate(item?.createdAt)
            let applyBtnCell = document.createElement('td');
            applyBtnCell.innerHTML = `<button class='applyBtn btn' id='${item?._id}' ${item?.applied ? 'disabled' : ''}>Apply Now</button>`;
            tbody.appendChild(tr)
            tr.appendChild(ticketIdsCell)
            tr.appendChild(dateCell)
            tr.appendChild(applyBtnCell)
            let applyBtn = applyBtnCell.getElementsByClassName('applyBtn')[0]
            console.log("applyBtn==", applyBtn)
            item?.applied ? applyBtn.innerText = 'Applied' : applyBtn.innerText = 'Apply Now'
            applyBtn.onclick = function () {
                // modal.style.display = "block";
                // alert(item?._id)
                console.log("item clicked==", item)
                applyTickets(item)
            }
        })

    }

    const showListData = () => {
        let listDiv = document.createElement('div');
        listDiv.id = 'subscription-list';
        contentDiv.appendChild(listDiv)
        let headerDiv = document.createElement('div');
        headerDiv.id = 'subscription-header';
        headerDiv.className = "subscription-header"
        listDiv.appendChild(headerDiv)
        let h2 = document.createElement('h2');
        h2.innerText = "Membership Entries"
        headerDiv.appendChild(h2)
        if (tableData?.length > 0) {
            let tableDiv = document.createElement('div');
            tableDiv.id = 'subscription-details';
            tableDiv.className = "subscription-details"
            listDiv.appendChild(tableDiv)
            tableDiv.innerHTML = tableStructure;
            let mainFooterDiv = document.createElement('div');
            mainFooterDiv.id = 'subscription-footer'
            contentDiv.appendChild(mainFooterDiv)
            let paginationContent = `<div>
            <button class='btn' id="prevBtn">Previous</button>
            <button class='btn' id='nextBtn'>Next</button>
            </div>
            <div>
                <p id='pagination-detail'>Showing ${currentPage} page of ${totalPages} page</p>
            </div>`
            mainFooterDiv.innerHTML = paginationContent;
            manageFooterBtns()
            nextBtn.onclick = () => handleNextBtn();
            prevBtn.onclick = () => handlePrevBtn();
            generateRows()
        } else {
            let emptyDiv = document.createElement('div');
            emptyDiv.id = 'subscription-details-empty';
            emptyDiv.className = "subscription-details-empty"
            emptyDiv.innerHTML = `<p>No Data Found for listing...</p>`
            listDiv.appendChild(emptyDiv)
        }
    }

    /**show subscription more detail */
    const loaderStop = () => {
        let loader = document.getElementById('loader')
        if (loader) {
            loader.remove();
        }
    }
    const showDetailedData = () => {
        let detailedDiv = document.createElement('div');
        detailedDiv.id = 'contract-detail';
        contentDiv.appendChild(detailedDiv)
        if (contractDetailShopify == '') {
            detailedDiv.innerHTML = `<h2>Something went wrong</h2>`
        } else {
            detailedDiv.innerHTML = `<div id='contract-header' class='contract-header'>
            <div id="customer-name">
                <p>Hi ${capitalize(contractDetailShopify?.customer?.firstName)}</p>
            </div>
            <div id="contractId">
                <button class='btn' id="backBtn"> Back To List</button>
            </div>
        </div>
        <div id="card">
            <p class='left-div'>Billing Frequency: <b>${contractDetailShopify?.billingPolicy?.interval?.toLowerCase() == 'day' ? 'Onetime' : capitalize(contractDetailShopify?.billingPolicy?.interval)}</b></p>
            
            <p class='right-div' id='billingCycle'>Minimum billing cycles: <b>${contractDetailShopify?.billingPolicy?.minCycles}</b></p>
        </div>
        <div id="product-list">
            <table>
                <thead class='sub-table-head'>
                    <tr>
                        <td>Product</td>
                        <td>Price (${contractDetailShopify?.lines?.edges[0]?.node?.currentPrice?.currencyCode})</td>
                        <td>Entries</td>
                        <td>Total (${contractDetailShopify?.lines?.edges[0]?.node?.currentPrice?.currencyCode})</td>
                    </tr>
                </thead>
                <tbody id="product-row">
                
                </tbody>
            </table>
            <div class='ticketIds-listing'>

            <table>
                <thead class='ticket-listing-table-head'>
                    <tr>
                        <td colspan="2">Your Ticket ids</td>
                        <td >Created Date</td>
                        <td ></td>
                    </tr>
                </thead>
                <tbody id="ticket-listing-row">
                
                </tbody>
            </table>
            </div>
            <div id="contract-footer">
               
            </div>
        </div>`
            let backBtn = document.getElementById("backBtn")

            backBtn.onclick = () => main();
            let pTag = document.getElementById("billingCycle")
            if (contractDetailShopify?.billingPolicy?.interval?.toLowerCase() == 'day') {
                pTag.style.display = 'none'
            }
            generateProductRows()
            generateTicketsrow()
        }

    }
})