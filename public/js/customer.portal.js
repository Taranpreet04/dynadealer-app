document.addEventListener("DOMContentLoaded", () => {
    console.log("my js file for customer porta")
    let serverPath = "https://dynadealersapp.com";
    // let serverPath = "https://mess-belief-eagle-junior.trycloudflare.com";
    const url = new URL(window.location.href);
    const customerId = url.searchParams.get("cid");
    let shop = Shopify.shop;
    let dbData = false
    let subscriptionDetails = []
    let tableData = []
    let contractDetailShopify = ''
    let contractDetailDb = ''
    let selectedSubscription = {}
    let totalPlans = 0
    let totalPages = 0
    let currentPage = 1
    let canCancelSubscription = false;
    let activeDraws = []
    let selectedAppliedFor = {
        productId: '',
        productName: '',
        appliedDate: '',
        applyTicketsCount: 0
    }
    // let applyTicketCount=0
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
        return currencySymbols[currencyCode?.toUpperCase() || "USD"] || `Symbol not found for ${currencyCode}`;
    }

    let currencySymbol = getCurrencySymbol(Shopify?.currrency?.active || 'USD')
    let tableStructure = `<table>
        <thead class='sub-table-head'>
            <tr>
                <td>Order Id</td>
                <td>Customer Name</td>
                <td>Purchase Type</td>
                <td>Entries</td>
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
                    </div>
                    <div id='cancelModalfooter'>
                        <button class="yesBtn btn" id="yesBtn">YES</button>
                        <button class="closeBtn btn" id="closeBtn">NO</button>
                    </div>
                </div>`
    let modalContentToAlert = `<div class="modal-content">
                    <span class="close">&times;</span>
                    <h3 id='cancelModalHead'>Alert!</h3>
                    <div id='cancelModalBody'>
                        <p>Sorry, you are not able to cancel subscription as your minimum subscription cycles are not completed.</p>
                    </div>
                    <div id='cancelModalfooter'>
                        <button class="yesBtn btn" id="okBtn">Ok</button>
                    </div>
                </div>`
    let modalContentToApplyTickets = `<div class="modal-content">
                    <span class="close">&times;</span>
                    <h3 id='cancelModalHead'>Apply Confirmation</h3>
                    <div id='cancelModalBody'>
                        <p> Are you sure you want to apply for this draw?
                        Once you apply, you won’t be able to change it.</p>
                    </div>
                   <div id='cancelModalfooter'>
                        <button class="yesBtn btn" id="yesBtn">Enter</button>
                        <button class="closeBtn btn" id="closeBtn">Cancel</button>
                    </div>
                </div>`
    let modalContentToNotAllow = `<div class="modal-content">
                    <span class="close">&times;</span>
                    <h3 id='cancelModalHead'>Limited spots</h3>
                    <div id='cancelModalBody'>
                        <p>You are not able to apply tickets as your tickets are not eual to spots.</p>
                    </div>
                   <div id='cancelModalfooter'>
                        <button class="closeBtn btn" id="closeBtn">ok</button>
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
                        body: JSON.stringify({ cid: customerId }),
                        // mode: 'no-cors',
                    }
                );

                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const result = await response?.json();
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
                if (dbData) {
                    contractDetailShopify = result?.data
                    currencyCode = result?.data?.products[0]?.currency
                    currencySymbol = getCurrencySymbol(currencyCode)
                } else {
                    contractDetailShopify = result?.data?.subscriptionContract;
                    currencyCode = contractDetailShopify?.lines?.edges[0]?.node?.currentPrice?.currencyCode
                    currencySymbol = getCurrencySymbol(contractDetailShopify?.lines?.edges[0]?.node?.pricingPolicy?.cycleDiscounts[0]?.adjustmentValue?.currencyCode)

                }
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
                    body: JSON.stringify({ id: selectedSubscription?.contractId, shop: selectedSubscription?.shop }),
                }
            );

            const result = await response.json();
            if (result.message == "success") {
                contractDetailDb = result?.details
                activeDraws = result?.activeDraws
                selectedAppliedFor = {
                    ...selectedAppliedFor,
                    productId: activeDraws[0]?.id,
                    productName: activeDraws[0]?.title,
                    raffleType: activeDraws[0].raffleType,
                    spots: activeDraws[0].spots,
                    productImg: activeDraws[0].image,
                }
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
    const applyTickets = async () => {
        try {
            data = {
                ...selectedSubscription,
                ticketDetails: {
                    ...selectedSubscription?.ticketDetails,
                    applied: Number(selectedSubscription?.ticketDetails?.applied) + Number(selectedAppliedFor?.applyTicketsCount),
                    appliedTicketsList: [
                        ...selectedSubscription?.ticketDetails?.appliedTicketsList,
                        ...selectedSubscription?.ticketDetails?.availableTicketsList.slice(0, Number(selectedAppliedFor?.applyTicketsCount))
                    ],
                    available: Number(selectedSubscription?.ticketDetails?.available) - Number(selectedAppliedFor?.applyTicketsCount),
                    availableTicketsList: [
                        ...selectedSubscription?.ticketDetails?.availableTicketsList.slice(Number(selectedAppliedFor?.applyTicketsCount))
                    ],
                    appliedForDetail: [
                        ...selectedSubscription?.ticketDetails?.appliedForDetail,
                        {
                            tickets: Number(selectedAppliedFor?.applyTicketsCount),
                            productId: selectedAppliedFor?.productId,
                            productName: selectedAppliedFor?.productName,
                            appliedList: [...selectedSubscription?.ticketDetails?.availableTicketsList.slice(0, Number(selectedAppliedFor?.applyTicketsCount))],
                            appliedDate: new Date()
                        }
                    ]
                }
            }

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
                // let applyBtn = document.getElementById(`${item?._id}`)
                // let appliedFor = document.getElementById(`appliedFor-${item?._id}`)
                // applyBtn.disabled = true
                // applyBtn.innerText = 'Applied'
                // appliedFor.innerText = result?.details?.appliedFor?.productName
                let totalTd = document.getElementById('total-tickets')
                if (totalTd) {
                    totalTd.innerText = result?.details?.ticketDetails?.total;
                }
                let appliedTd = document.getElementById('applied-tickets')
                if (appliedTd) {
                    appliedTd.innerText = result?.details?.ticketDetails?.applied;
                }
                let availableTd = document.getElementById('available-tickets')
                if (availableTd) {
                    availableTd.innerText = result?.details?.ticketDetails?.available;
                }
                let totalList = document.getElementById('total-tickets-list')
                if (totalList) {
                    totalList.innerText = result?.details?.ticketDetails?.totalTicketsList?.join(', ');
                }
                let appliedList = document.getElementById('applied-tickets-list')
                if (appliedList) {
                    appliedList.innerText = result?.details?.ticketDetails?.appliedTicketsList?.join(', ');
                }
                let availableList = document.getElementById('available-tickets-list')
                if (availableList) {
                    availableList.innerText = result?.details?.ticketDetails?.availableTicketsList?.join(', ')
                }

                let tbody = document.getElementById("already-applied-row")
                if (tbody) {
                    let tr1 = document.createElement('tr');
                    tbody.appendChild(tr1)
                    let totalCell = document.createElement('td');
                    totalCell.innerText = selectedAppliedFor?.productName
                    tr1.appendChild(totalCell)

                    let totalListCell = document.createElement('td');
                    totalListCell.innerText = result?.details?.ticketDetails?.appliedTicketsList?.slice(-Number(selectedAppliedFor?.applyTicketsCount)).join(', ') || 'jj'
                    tr1.appendChild(totalListCell)
                }
                selectedAppliedFor = {
                    ...selectedAppliedFor,
                    applyTicketsCount: 0
                }

                let entriesCell= document.getElementById('product-entriesCell')
                entriesCell?  entriesCell.innerText= result?.details?.ticketDetails?.applied: ''
                let availableEntriesCell= document.getElementById('product-availableEntriesCell');
                availableEntriesCell? availableEntriesCell.innerText= result?.details?.ticketDetails?.available: ''
                let totalEntriesCell= document.getElementById('product-totalEntriesCell')
                totalEntriesCell?  totalEntriesCell.innerText= result?.details?.ticketDetails?.total: ''
                selectedSubscription = result?.details
                showToast(`Successfully applied for the ${selectedAppliedFor?.productName} giveaway.`)
            }
        } catch (error) {
            loaderStop();
            console.error("Error:", error);
        }
    }

    const generateRows = () => {
        let tbody = document.getElementById("sub-row")
        tbody.innerHTML = ''
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
            // entriesCell.innerText = getEntries(item?.sellingPlanName)
            entriesCell.innerText = item?.ticketDetails?.total
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
                // cappedraffle = true
                await checkCancelPossible()
                item?.contractId === '' ? dbData = true : dbData = false
                await getContractDetails(item?.contractId === '' ? item?._id : item?.contractId)
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
    const resetModalContent = () => {
        let footer = document.getElementById("contract-footer")
        // footer.innerHTML=''
        let modal = document.getElementById("myModal")
        if (!modal) {
            modal = document.createElement('div');
            modal.id = "myModal";
            modal.className = "modal"
        }
        if (canCancelSubscription) {
            modal.innerHTML = modalContentToCancel
        } else {
            modal.innerHTML = modalContentToAlert
        }
        footer ?
            footer.appendChild(modal) : ''

        var span = document.getElementsByClassName("close")[0];
        if (span) {
            span.onclick = function () {
                modal.style.display = "none";
            }
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
    }
    const generateProductRows = () => {
        let tbody = document.getElementById("product-row")
        let products = dbData ? contractDetailShopify?.products : contractDetailShopify?.lines?.edges
        console.log("selectedSubscription==prod", selectedSubscription)
        products?.map((item, index) => {
            let tr = document.createElement('tr');
            tr.id = index
            tbody.appendChild(tr)
            let productCell = document.createElement('td');
            productCell.id = "title-img"
            let priceCell = document.createElement('td');
            priceCell.innerText = dbData ? `${currencySymbol}${item?.price}` : `${currencySymbol}${item?.node?.pricingPolicy?.cycleDiscounts[0]?.adjustmentValue?.amount}`
            let entriesCell = document.createElement('td');
            entriesCell.id= 'product-entriesCell'
            entriesCell.innerText = dbData ? contractDetailShopify?.ticketDetails?.applied : `${selectedSubscription?.ticketDetails?.applied}`
            let availableEntriesCell = document.createElement('td');
            availableEntriesCell.id= 'product-availableEntriesCell'
            availableEntriesCell.innerText = dbData ? contractDetailShopify?.ticketDetails?.available : `${selectedSubscription?.ticketDetails?.available}`
            let totalEntriesCell = document.createElement('td');
            totalEntriesCell.id= 'product-totalEntriesCell'
            totalEntriesCell.innerText = dbData ? contractDetailShopify?.ticketDetails?.total : `${selectedSubscription?.ticketDetails?.total}`
            let totalCell = document.createElement('td');
            // totalCell.id= 'product-totalCell'
            totalCell.innerText = dbData ? `${currencySymbol}${item?.price}` : `${currencySymbol}${(item?.node?.pricingPolicy?.cycleDiscounts[0]?.adjustmentValue?.amount * item?.node?.quantity).toFixed(2)}`
            tbody.appendChild(tr)
            tr.appendChild(productCell)
            tr.appendChild(priceCell)
            tr.appendChild(entriesCell)
            tr.appendChild(availableEntriesCell)
            tr.appendChild(totalEntriesCell)
            tr.appendChild(totalCell)
            let imgDiv = document.createElement('img');
            imgDiv.src = item?.node?.variantImage?.url
            imgDiv.height = 50
            imgDiv.width = 50
            let p = document.createElement('p');
            p.innerText = dbData ? item?.productName : item?.node?.title
            // productCell.appendChild(imgDiv)
            productCell.appendChild(p)
        })

        // let footer = document.getElementById("contract-footer")
        let status = contractDetailShopify?.status?.toLowerCase()
        let btn = document.getElementById("cancelBtn")
        btn.style.display = "block";
        resetModalContent()
        if (status == "active") {

            let modal = document.getElementById('myModal')
            btn.onclick = function () {
                modal.style.display = "block";
                // document.body.classList.add("modal-open");
            }
        } else {
            btn.innerText = 'Canclled'
            btn.disabled = true;
            // footer.remove()
        }
    }
    // const generateTicketsrow = () => {
    //     let tbody = document.getElementById("ticket-listing-row")
    //     // let products = contractDetailShopify?.lines?.edges
    //     contractDetailDb?.map((item, index) => {
    //         !(item?.applied) ?
    //             item.appliedFor = {
    //                 productName: activeDraws[0]?.title,
    //                 productId: activeDraws[0]?.id
    //             }
    //             : ''
    //         let tr = document.createElement('tr');
    //         tr.id = index
    //         tbody.appendChild(tr)
    //         let ticketIdsCell = document.createElement('td');
    //         ticketIdsCell.id = "ticketIds"
    //         ticketIdsCell.colSpan = 2;
    //         let content = item?.drawIds.join(', ')
    //         ticketIdsCell.innerText = content
    //         let selectCell = document.createElement('td');
    //         selectCell.id = `appliedFor-${item?._id}`
    //         item?.applied ? selectCell.innerText = item?.appliedFor?.productName :
    //             selectCell.innerHTML = ` <select id='drawsList${index}' name="drawsList" class='drawsList'>
    //                      </select>`
    //         let dateCell = document.createElement('td');
    //         dateCell.innerText = formatISOToDate(item?.createdAt)
    //         let applyBtnCell = document.createElement('td');
    //         applyBtnCell.innerHTML = `<button class='applyBtn btn' id='${item?._id}' ${item?.applied ? 'disabled' : ''}>Apply Now</button>`;
    //         tbody.appendChild(tr)
    //         tr.appendChild(ticketIdsCell)
    //         tr.appendChild(selectCell)
    //         tr.appendChild(dateCell)
    //         tr.appendChild(applyBtnCell)
    //         let applyBtn = applyBtnCell.getElementsByClassName('applyBtn')[0]
    //         item?.applied ? applyBtn.innerText = 'Applied' : applyBtn.innerText = 'Apply Now'
    //         applyBtn.onclick = function () {
    //             let modal = document.getElementById("myModal")
    //             console.log("modal=", modal)
    //             if (modal) {
    //                 modal.innerHTML = modalContentToApplyTickets
    //                 var span = modal.getElementsByClassName("close")[0];
    //                 if(span){
    //                     span.onclick = function () {
    //                         modal.style.display = "none";
    //                         // document.body.classList.remove("modal-open");
    //                     }
    //                 }

    //                 let yesBtn = document.getElementById("yesBtn")
    //                 let closeBtn = document.getElementById("closeBtn")
    //                 let okBtn = document.getElementById("okBtn")

    //                 if (okBtn) {
    //                     okBtn.onclick = function () {
    //                         modal.style.display = "none";
    //                         // document.body.classList.remove("modal-open");
    //                     }
    //                 }
    //                 if (closeBtn) {
    //                     closeBtn.onclick = function () {
    //                         modal.style.display = "none";
    //                         // document.body.classList.remove("modal-open");
    //                     }
    //                 }
    //                 if (yesBtn) {
    //                     yesBtn.onclick = function () {
    //                         modal.style.display = "none";
    //                         // document.body.classList.remove("modal-open");
    //                         applyTickets(item)
    //                         resetModalContent()
    //                     }
    //                 }
    //                 let body = document.getElementById('cancelModalBody')
    //                 if (body) {
    //                     body.innerHTML = `<p>Are you sure you want to apply for <span class="red-bold">${item?.appliedFor?.productName}</span> draw?
    //                     Once you apply, you won’t be able to change it.</p>`
    //                 }
    //                 modal.style.display = "block";
    //                 // document.body.classList.add("modal-open");
    //             }
    //         }


    //         let selectElement = document.getElementById(`drawsList${index}`)
    //         if (selectElement) {
    //             activeDraws.map(option => {
    //                 const opt = document.createElement('option');
    //                 opt.value = option.title;
    //                 opt.id = option.id;
    //                 opt.textContent = option.title;
    //                 opt.className = 'draw-option';
    //                 selectElement.appendChild(opt);
    //             })
    //             selectElement.addEventListener("change", (e) => {
    //                 let data = activeDraws.filter(itm => itm?.title == e.target.value)
    //                 contractDetailDb.map((itm, index) => {
    //                     if (itm?._id == item?._id) {
    //                         itm.appliedFor = {
    //                             productName: data[0]?.title,
    //                             productId: data[0]?.id
    //                         }
    //                     }
    //                 })
    //             });
    //         }
    //     })

    // }


    const generateActiveDrawCards = () => {
        let mainDiv = document.getElementById('main-active-draws')
        let h3 = document.createElement('h3')
        h3.innerText = `We have ${activeDraws?.length} active giveaway. You can apply your tickets and enter now!`
        mainDiv.appendChild(h3)
        // let parentCard = document.createElement('div')
        // mainDiv.appendChild(parentCard)
        // parentCard.className = 'draw-cards'
        // activeDraws?.map((product) => {
        //     let card = document.createElement('div')
        //     parentCard.appendChild(card)
        //     card.className = 'active-draw-card'
        //     card.id = 'active-draw-card'
        //     let p = document.createElement('p')
        //     p.innerText = `Active ${product?.title} draw.`
        //     let p2 = document.createElement('p')
        //     p2.innerText = `Apply your ${product?.raffleType == 'capped' ? product?.spots : ''} entry`
        //     let p3 = document.createElement('p')
        //     p3.innerText = `Don't miss your chance.`
        //     card.appendChild(p)
        //     card.appendChild(p2)
        //     card.appendChild(p3)
        // })
    }
    const selectDraw = () => {
        let mainDiv = document.getElementById('main-active-draws')
        let parentselect = document.createElement('div')
        parentselect.id = 'user-input'
        let content = `<div class="select">
	    <div class="selectBtn" id='selectBtn' data-type="firstOption">${selectedAppliedFor?.productName}</div>
	    <div class="selectDropdown" id="drawsList">
		  
	    </div>
    </div>`
        parentselect.innerHTML = content;
        mainDiv.appendChild(parentselect)

        let selectBtn = document.getElementById(`selectBtn`)
        let selectElement = document.getElementById(`drawsList`)
        if (selectElement) {
            activeDraws.map(option => {
                const opt = document.createElement('div');
                opt.value = option.title;
                opt.id = option.id;
                opt.textContent = option.title;
                opt.className = 'option';
                // opt.data-type = option.title;
                selectElement.appendChild(opt);
            })

        }

        let index = 1;

        const on = (listener, query, fn) => {
            document.querySelectorAll(query).forEach(item => {
                item.addEventListener(listener, el => {
                    fn(el);
                })
            })
        }

        on('click', '.selectBtn', item => {
            const next = item.target.nextElementSibling;
            next.classList.toggle('toggle');
            next.style.zIndex = index++;
        });
        on('click', '.option', item => {
            item.target.parentElement.classList.remove('toggle');

            const parent = item.target.closest('.select').children[0];
            parent.setAttribute('data-type', item.target.getAttribute('data-type'));
            parent.innerText = item.target.innerText;
            let data = activeDraws.filter(itm => itm?.title == item.target.innerText)
            selectedAppliedFor = {
                ...selectedAppliedFor,
                productId: data[0]?.id,
                productName: data[0]?.title,
                raffleType: data[0].raffleType,
                spots: data[0].spots,
                productImg: data[0].image,
            }
            if (Number(selectedSubscription?.ticketDetails?.available) >= 1) {
                document.getElementById('applied-tickets-div').style.display = 'flex';
                let content = document.getElementsByClassName('red-bold')[0]
                if (content) {
                    content.innerText = item.target.innerText
                }
            } else {
                document.getElementById('applied-tickets-div').style.display = 'none';
            }
        })
    }
    const inputForApply = () => {

        let inputDiv = document.getElementById('user-input')

        let input = document.createElement('input');
        input.id = 'applied-tickets-input';
        input.type = 'number';
        input.value = 0;
        inputDiv.appendChild(input)
        let span = document.createElement('span');
        span.id = 'err-msg'
        inputDiv.appendChild(span)
        input.addEventListener('change', (e) => {
            selectedAppliedFor = {
                ...selectedAppliedFor,
                applyTicketsCount: e.target.value
            }
            let spanh = document.getElementById('err-msg')
            if (e.target.value <= 0) {
                if (spanh) {
                    spanh.innerText = "Enter any value to apply tickets."
                }
            } else {
                if (spanh) {
                    spanh.innerText = ""
                }
            }
        })


        let applyBtnDiv = document.createElement('div');
        applyBtnDiv.innerHTML = `<button class='applyBtn btn' id='applyBtn'>Apply Now</button>`;
        inputDiv.appendChild(applyBtnDiv)
        let applyBtn = document.getElementById('applyBtn')
        if (applyBtn) {
            applyBtn.onclick = function () {
                let spanh = document.getElementById('err-msg')
                if (selectedAppliedFor?.applyTicketsCount > 0) {
                    let modal = document.getElementById("myModal")
                    if (selectedAppliedFor?.raffleType === 'time-limit') {

                        if (modal) {
                            modal.innerHTML = modalContentToApplyTickets
                            var span = modal.getElementsByClassName("close")[0];
                            if (span) {
                                span.onclick = function () {
                                    modal.style.display = "none";
                                    resetModalContent()
                                    document.body.classList.remove("modal-open");
                                }
                            }

                            // let yesBtn = document.getElementById("yesBtn")
                            let closeBtn = document.getElementById("closeBtn")
                            let okBtn = document.getElementById("okBtn")
                            let yesBtn = document.getElementById("yesBtn")
                            if (yesBtn) {
                                yesBtn.onclick = function () {
                                    modal.style.display = "none";
                                    document.body.classList.remove("modal-open");
                                    applyTickets()
                                    resetModalContent()
                                    input.value = 0
                                   
                                }
                            }
                            if (okBtn) {
                                okBtn.onclick = function () {
                                    modal.style.display = "none";
                                    document.body.classList.remove("modal-open");
                                    resetModalContent()
                                }
                            }
                            if (closeBtn) {
                                closeBtn.onclick = function () {
                                    modal.style.display = "none";
                                    document.body.classList.remove("modal-open");
                                    resetModalContent()
                                }
                            }
                            let body = document.getElementById('cancelModalBody')
                            if (body) {
                                if (Number(selectedSubscription?.ticketDetails?.available) >= Number(selectedAppliedFor?.applyTicketsCount)) {
                                    yesBtn ? yesBtn.style.display = 'inline-block' : ''
                                    // okBtn ?  okBtn.innerText= 'Ok': ''
                                    body.innerHTML = `<p>
                  Are you sure you want to apply ${selectedAppliedFor?.applyTicketsCount} tickets to enter <span class="red-bold">${selectedAppliedFor?.productName}</span> raffle?
                Once you enter, you won’t be able to change it.</p>`
                                } else {
                                    yesBtn ? yesBtn.style.display = 'none' : ''
                                    //    okBtn?  okBtn.innerText= 'Cancel': ''
                                    body.innerHTML = `<p>
                    You are not able to apply tickets as you apply greater than ${selectedSubscription?.ticketDetails?.available} tickets.</p>`
                                }
                            }
                            modal.style.display = "block";
                            // document.body.classList.add("modal-open");
                        }
                    } else if (selectedAppliedFor?.spots == selectedAppliedFor?.applyTicketsCount || selectedAppliedFor?.raffleType !== 'capped') {


                        if (modal) {
                            modal.innerHTML = modalContentToApplyTickets
                            var span = modal.getElementsByClassName("close")[0];
                            if (span) {
                                span.onclick = function () {
                                    modal.style.display = "none";
                                    resetModalContent()
                                    document.body.classList.remove("modal-open");
                                }
                            }

                            let yesBtn = document.getElementById("yesBtn")
                            let closeBtn = document.getElementById("closeBtn")
                            let okBtn = document.getElementById("okBtn")

                            if (okBtn) {
                                okBtn.onclick = function () {
                                    modal.style.display = "none";
                                    document.body.classList.remove("modal-open");
                                    resetModalContent()
                                }
                            }
                            if (closeBtn) {
                                closeBtn.onclick = function () {
                                    modal.style.display = "none";
                                    document.body.classList.remove("modal-open");
                                    resetModalContent()
                                }
                            }
                            if (yesBtn) {
                                yesBtn.onclick = function () {
                                    modal.style.display = "none";
                                    document.body.classList.remove("modal-open");
                                    applyTickets()
                                    input.value = 0
                                    selectedAppliedFor = {
                                        ...selectedAppliedFor,
                                        applyTicketsCount: 0
                                    }
                                    resetModalContent()
                                }
                            }
                            let body = document.getElementById('cancelModalBody')
                            if (body) {
                                body.innerHTML = `<p>Are you sure you want to apply ${selectedAppliedFor?.applyTicketsCount} tickets to enter <span class="red-bold">${selectedAppliedFor?.productName}</span> raffle?
                Once you enter, you won’t be able to change it.</p>`
                            }
                            modal.style.display = "block";
                            // document.body.classList.add("modal-open");
                        }
                    } else {

                        if (modal) {
                            modal.innerHTML = modalContentToNotAllow
                            var span = modal.getElementsByClassName("close")[0];
                            if (span) {
                                span.onclick = function () {
                                    modal.style.display = "none";
                                    resetModalContent()
                                    document.body.classList.remove("modal-open");
                                }
                            }

                            // let yesBtn = document.getElementById("yesBtn")
                            let closeBtn = document.getElementById("closeBtn")
                            let okBtn = document.getElementById("okBtn")

                            if (okBtn) {
                                okBtn.onclick = function () {
                                    modal.style.display = "none";
                                    document.body.classList.remove("modal-open");
                                    resetModalContent()
                                }
                            }
                            if (closeBtn) {
                                closeBtn.onclick = function () {
                                    modal.style.display = "none";
                                    document.body.classList.remove("modal-open");
                                    resetModalContent()
                                }
                            }
                            let body = document.getElementById('cancelModalBody')
                            if (body) {
                                if (selectedAppliedFor?.spots > selectedAppliedFor?.applyTicketsCount) {

                                    body.innerHTML = `<p>
                    You are not able to apply tickets as you apply less than ${selectedAppliedFor?.spots} tickets.</p>`
                                } else {
                                    body.innerHTML = `<p>
                    You are not able to apply tickets as you apply greater than ${selectedAppliedFor?.spots} tickets.</p>`
                                }
                            }
                            modal.style.display = "block";
                            // document.body.classList.add("modal-open");
                        }
                    }

                    if (spanh) {
                        spanh.innerText = ""
                    }
                } else {
                    if (spanh) {
                        spanh.innerText = "Enter any value to apply tickets."
                    }
                }
            }
        }
        if (Number(selectedSubscription?.ticketDetails?.available) >= 1) {
            inputDiv.style.display = 'flex'
        } else {
            inputDiv.style.display = 'none'
        }
    }

    const ticketDetail = () => {
        let tbody = document.getElementById("ticket-detail-row")

        let tr2 = document.createElement('tr');
        tbody.appendChild(tr2)
        let appliedCell = document.createElement('td');
        appliedCell.innerText = 'Applied Tickets'
        tr2.appendChild(appliedCell)
        let appliedNumberCell = document.createElement('td');
        appliedNumberCell.id = 'applied-tickets'
        appliedNumberCell.innerText = selectedSubscription?.ticketDetails?.applied
        tr2.appendChild(appliedNumberCell)
        let appliedListCell = document.createElement('td');
        appliedListCell.id = 'applied-tickets-list'
        appliedListCell.innerText = selectedSubscription?.ticketDetails?.appliedTicketsList?.join(', ')
        tr2.appendChild(appliedListCell)

        let tr3 = document.createElement('tr');
        tbody.appendChild(tr3)
        let restCell = document.createElement('td');
        restCell.innerText = 'Available Tickets'
        tr3.appendChild(restCell)
        let restNumberCell = document.createElement('td');
        restNumberCell.id = 'available-tickets'
        restNumberCell.innerText = selectedSubscription?.ticketDetails?.available
        tr3.appendChild(restNumberCell)
        let restListCell = document.createElement('td');
        restListCell.id = 'available-tickets-list'
        restListCell.innerText = selectedSubscription?.ticketDetails?.availableTicketsList?.join(', ')
        tr3.appendChild(restListCell)


        let tr1 = document.createElement('tr');
        tbody.appendChild(tr1)
        let totalCell = document.createElement('td');
        totalCell.innerText = 'Total Tickets'
        tr1.appendChild(totalCell)
        let totalNumberCell = document.createElement('td');
        totalNumberCell.id = 'total-tickets'
        totalNumberCell.innerText = selectedSubscription?.ticketDetails?.total
        tr1.appendChild(totalNumberCell)
        let totalListCell = document.createElement('td');
        totalListCell.id = 'total-tickets-list'
        totalListCell.innerText = selectedSubscription?.ticketDetails?.totalTicketsList?.join(', ')
        tr1.appendChild(totalListCell)

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
            let paginationContent = `<div class='pagination'>
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


    const alreadyAppliedDetails = () => {
        let tbody = document.getElementById("already-applied-row")
        if (selectedSubscription?.ticketDetails?.applied > 0) {

            selectedSubscription?.ticketDetails?.appliedForDetail?.map((item) => {

                let tr1 = document.createElement('tr');
                tbody.appendChild(tr1)
                let totalCell = document.createElement('td');
                totalCell.innerText = item?.productName
                tr1.appendChild(totalCell)

                let totalListCell = document.createElement('td');
                totalListCell.innerText = item?.appliedList?.join(', ')
                tr1.appendChild(totalListCell)
            })
        } else {
            tbody.parentElement.style.display = "none"
        }

    }

    const showDetailedData = () => {
        let detailedDiv = document.createElement('div');
        detailedDiv.id = 'contract-detail';
        contentDiv.appendChild(detailedDiv)
        if (contractDetailShopify == '') {
            detailedDiv.innerHTML = `<h2>Something went wrong</h2>`
        } else {
            detailedDiv.innerHTML = `<div id="contract-header" class="contract-header">
  <div id="customer-name">
    <p>Hi ${dbData ? capitalize(contractDetailShopify?.customerName) : capitalize(contractDetailShopify?.customer?.firstName)}</p>
  </div>
  <div id="contractId">
    <button class="btn" id="cancelBtn">Cancel</button>
    <button class="btn" id="backBtn">Back To List</button>
  </div>
</div>
<div class="contract-detail-body" id='contract-body'>
    <div id="card" class="header-details">
        <p class="left-div">
          Billing Frequency:
          <b>${dbData ? capitalize(contractDetailShopify?.billing_policy?.interval) : contractDetailShopify?.billingPolicy?.interval?.toLowerCase() == 'day'
                    ? 'Onetime' :
                    capitalize(contractDetailShopify?.billingPolicy?.interval)}</b>
        </p>
      
        <p class="right-div" id="billingCycle">
          Minimum billing cycles:
          <b>${dbData ? contractDetailShopify?.billing_policy?.min_cycles : contractDetailShopify?.billingPolicy?.minCycles}</b>
        </p>
      </div>
      <div id="product-list">
        <table>
          <thead class="sub-table-head">
            <tr>
              <td>Product</td>
              <td>
                Price
                (${dbData ? currencyCode : contractDetailShopify?.lines?.edges[0]?.node?.currentPrice?.currencyCode})
              </td>
              <td>Applied Entries</td>
              <td>Available Entries</td>
              <td>Total Entries</td>
              <td>
                Total
                (${dbData ? currencyCode : contractDetailShopify?.lines?.edges[0]?.node?.currentPrice?.currencyCode})
              </td>
            </tr>
          </thead>
          <tbody id="product-row"></tbody>
        </table>
        </div>
        <div class="main-active-draws" id="main-active-draws"></div>

        <div class='already-applied-details' id='already-applied-details'>
      <table>
          <thead class="already-applied-table-head">
            <tr>
              <td colspan="2">Already Applied Ticket Details</td>
            </tr>
          </thead>
          <tbody id="already-applied-row">
          <tr>
            <td>Applied for</td>
            <td>Ticket-List</td>
          </tr>
          </tbody>
        </table>
      </div>
    <div class="applied-tickets-div" id="applied-tickets-div"></div>
     
      <div class='ticket-details' id='ticket-details'>
      <table>
          <thead class="ticket-detail-table-head">
            <tr>
              <td colspan="3">All Ticket Details</td>
            </tr>
          </thead>
          <tbody id="ticket-detail-row"></tbody>
        </table>
      </div>
</div>
<div id="contract-footer">

</div>`
            let backBtn = document.getElementById("backBtn")

            backBtn.onclick = () => main();
            let pTag = document.getElementById("billingCycle")
            if (contractDetailShopify?.billingPolicy?.interval?.toLowerCase() == 'day') {
                pTag.style.display = 'none'
            }
            generateProductRows()
            generateActiveDrawCards()
            // generateTicketsrow()
            alreadyAppliedDetails()
            selectDraw()
            inputForApply()
            ticketDetail()
        }

    }
})













{/* <div class="ticketIds-listing">
<table>
  <thead class="ticket-listing-table-head">
    <tr>
      <td colspan="2">Your Ticket ids</td>
      <td>Apply For</td>
      <td>Created Date</td>
      <td></td>
    </tr>
  </thead>
  <tbody id="ticket-listing-row"></tbody>
</table>
</div> */}