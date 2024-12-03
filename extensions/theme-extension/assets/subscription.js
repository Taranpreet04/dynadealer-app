// console.log("js---=")
// let activeCurrency = Shopify?.currency?.active;
// let purchaseOption = "oneTime-purchase"
// let allSellingPlans = []
// let oneTimePlans = []
// let otherPlans = []

// let shop = Shopify.shop;
// let currentUrl = window.location.href;
// let selectedPlan;
// if (currentUrl.includes("account")) {
//     console.log("hello from account page")
//     let targetElement = document.getElementsByTagName("a");
//     let targetArray = Array.from(targetElement);
//     targetArray.forEach((item) => {
//         let url = item.href;
//         if (url.includes("account/addresses")) {
//             let button = document.createElement("button");

//             let linebreak = document.createElement("br");
//             button.innerHTML = "Manage Subscriptions";

//             const id = ShopifyAnalytics.meta.page.customerId;
//             console.log("id==", id)
//             button.addEventListener("click", function () {
//                 const targetUrl = `https://${shop}/apps/subscription?cid=${id}`;
//                 // const targetUrl =  `https://playgroundstoree.myshopify.com/apps/subscription?cid=${id}`;
//                 console.log("targetUrl==", targetUrl)
//                 targetUrl ? window.location.href = targetUrl : "";
//                 //    fetchData(id);
//             });

//             item.parentNode.insertBefore(button, item);
//             button.insertAdjacentHTML("afterend", "<br>");
//         }
//     });
// }

// function showAmountWithCurrency(value) {
//     let moneyFormat = shopCurrencySymbol;
//     let revCurrencyFormatcondition;
  
//     if (moneyFormat.includes("{{amount_no_decimals}}")) {
//       revCurrencyFormatcondition = "amount_no_decimals";
//     } else if (moneyFormat.includes("{{amount_with_comma_separator}}")) {
//       revCurrencyFormatcondition = "amount_with_comma_separator";
//     } else if (
//       moneyFormat.includes("{{amount_no_decimals_with_space_separator}}")
//     ) {
//       revCurrencyFormatcondition = "amount_no_decimals_with_space_separator";
//     } else if (
//       moneyFormat.includes("{{amount_no_decimals_with_comma_separator}}") ||
//       moneyFormat.includes("${{ amount_no_decimals_with_comma_separator }}")
//     ) {
//       revCurrencyFormatcondition = "amount_no_decimals_with_comma_separator";
//     } else if (moneyFormat.includes("{{amount_with_space_separator}}$")) {
//       revCurrencyFormatcondition = "amount_with_space_separator";
//     } else if (moneyFormat.includes("{{amount}}")) {
//       revCurrencyFormatcondition = "amount";
//     } else {
//       let pattern = /{{(.*?)}}/;
//       let match = moneyFormat.match(pattern);
//       revCurrencyFormatcondition = `${match[1]}`;
//     }
  
//     let revCurrencyprice;
//     switch (revCurrencyFormatcondition) {
//       case "amount":
//         revCurrencyprice = moneyFormat.replace("{{amount}}", value);
//         break;
//       case "amount_with_comma_separator":
//         if (value) {
//           let stringValue = value.toString();
//           if (stringValue.indexOf(".") > 0) {
//             let comma_seperator = stringValue.replace(".", ",");
//             revCurrencyprice = moneyFormat.replace(
//               "{{amount_with_comma_separator}}",
//               comma_seperator
//             );
//           } else {
//             revCurrencyprice = moneyFormat.replace(
//               "{{amount_with_comma_separator}}",
//               value
//             );
//           }
//         } else {
//           revCurrencyprice = moneyFormat.replace(
//             "{{amount_with_comma_separator}}",
//             value
//           );
//         }
//         break;
//       case "amount_no_decimals_with_space_separator":
//         let noDecimalwithSpace = parseInt(value);
//         revCurrencyprice = moneyFormat.replace(
//           "{{amount_no_decimals_with_space_separator}}",
//           noDecimalwithSpace
//         );
//         break;
//       case "amount_no_decimals":
//         let noDecimal = parseInt(value);
//         revCurrencyprice = moneyFormat.replace(
//           "{{amount_no_decimals}}",
//           noDecimal
//         );
//         break;
//       case "amount_no_decimals_with_comma_separator":
//         let noDecimalwithComma = parseInt(value);
  
//         revCurrencyprice = moneyFormat.replace(
//           /{{amount_no_decimals_with_comma_separator}}|\${{ amount_no_decimals_with_comma_separator }}/g,
//           noDecimalwithComma
//         );
//         break;
//       case "amount_with_space_separator":
//         if (value) {
//           let spaceStringValue = value.toString();
//           if (spaceStringValue.indexOf(".") > 0) {
//             let Space_comma_seperator = spaceStringValue.replace(".", ",");
//             revCurrencyprice = moneyFormat.replace(
//               "{{amount_with_space_separator}}",
//               Space_comma_seperator
//             );
//           } else {
//             revCurrencyprice = moneyFormat.replace(
//               "{{amount_with_space_separator}}",
//               value
//             );
//           }
//         } else {
//           revCurrencyprice = moneyFormat.replace(
//             "{{amount_with_space_separator}}",
//             value
//           );
//         }
//         break;
//       default:
//         revCurrencyprice = moneyFormat.replace(
//           `{{${revCurrencyFormatcondition}}}`,
//           value
//         );
//     }
  
//     return revCurrencyprice;
//   }
//  let value= showAmountWithCurrency(12000)
//  console.log("value==showAmountWithCurrency===", value)
// if (filtered_selling_plan_groups?.length > 0) {
//     filtered_selling_plan_groups?.forEach((item) => {
//         allSellingPlans?.push(...item?.selling_plans)
//     })
//   allSellingPlans?.map(item=>{
//      console.log("item?.options[0]?.value=", item)
//      let interval= item?.options[0]?.value?.split(' ')?.[0]
//       console.log("interval=", interval)
//       if(interval == 'year'){
//          oneTimePlans?.push(item)
//       }else{
//         otherPlans?.push(item)
//       }
//   })
// }

// console.log("allSellingPlans====", allSellingPlans)
// console.log("otherPlans====", otherPlans)
// console.log("oneTimePlans====", oneTimePlans)
// // otherPlans = allSellingPlans;

// oneTimePlans?.length > 0 ? selectedPlan = oneTimePlans[0] : selectedPlan = otherPlans[0]
// const sendDataToCart = (plan) => {
//     var form = document.querySelectorAll('form[action*="/cart/add"]');
//     form.forEach((item) => {
//         var sellingPlanInputs = item.querySelectorAll(
//             'input[name="selling_plan"]'
//         );
//         if (sellingPlanInputs.length === 0) {
//             var newHiddenInput = document.createElement("input");
//             newHiddenInput.type = "hidden";
//             newHiddenInput.name = "selling_plan";
//             newHiddenInput.value = plan?.id;
//             item.appendChild(newHiddenInput);
//         } else {
//             sellingPlanInputs.forEach(function (input) {
//                 input.value = plan?.id;
//             });
//         }
//     });
// }
//  sendDataToCart(selectedPlan)



// const getCurrencySymbol = (currency) => {
//     const symbol = new Intl.NumberFormat("en", { style: "currency", currency })
//         .formatToParts()
//         .find((x) => x.type === "currency");
//     return symbol && symbol.value;
// };

// const calDiscountedPrice = (discount) => {
//   console.log("alert(discount", discount)
//     let productPrice = productJson?.price / 100;
//     console.log("productPrice=", productPrice)
//     let newPrice = productPrice;
//     let discountAmt = 0
//     if (discount > 0 || discount != undefined) {
//         discountAmt = (productPrice * discount) / 100;
//     }
//   console.log(discountAmt, typeof discountAmt, parseFloat((newPrice - parseFloat(discountAmt)).toFixed(2)))
//     return parseFloat((newPrice - parseFloat(discountAmt)).toFixed(2));
// }


// const generatePlans = () => {
//    let oneTimePlansDiv;
//    let otherPlansDiv;
//         if (oneTimePlans?.length > 0) {
//           oneTimePlansDiv= document.getElementById('oneTime-plans')
//           oneTimePlans?.map((item)=>{
//              let planDiv = document.createElement('div');
//               planDiv.className = (item?.id==selectedPlan?.id) ?"onetime-selling-plan active" :"onetime-selling-plan";  
//               planDiv.id = `${item?.id}`;
//               oneTimePlansDiv?.appendChild(planDiv)
//                // <span class='checkmark'></span>
//               let content= `
//               <label for="plan-${item?.id}">
//                 <input type="radio" name="sub-option" id="plan-${item?.id}" ${item?.id === selectedPlan?.id ? 'checked' : ''} />
//                 <div>
//                     <span class="var-price">${getCurrencySymbol(activeCurrency)}${(item?.price_adjustments[0]?.value) / 100}</span>
//                     <span class="var-entries">${item?.description} entries</span>
//                 </div>
//             </label>`
//             planDiv.innerHTML= content;
//             planDiv.querySelector(`#plan-${item?.id}`).addEventListener('change', () => handlePlanChange(item));
//           })
//         }else{
//            let parent = document.getElementById('oneTime');
//               console.log("oneTime==", parent)
//             if (parent) {
//                 parent.remove();
//             }
//         }
  
//     if (otherPlans?.length > 0) {
//         console.log("otherplans=", otherPlans)
//          otherPlansDiv= document.getElementById('subscription-plans')
//           otherPlans?.map((item)=>{
//              let planDiv = document.createElement('div');
//               planDiv.className = (item?.id==selectedPlan?.id) ? "subscription-selling-plan active" : "subscription-selling-plan";
//               planDiv.id = `${item?.id}`;
//               otherPlansDiv?.appendChild(planDiv)
//                // <span class='checkmark'></span>
//               let content= `
//                <label for="plan-${item?.id}">
//                 <input type="radio" name="sub-option" id="plan-${item?.id}" ${item?.id === selectedPlan?.id ? 'checked' : ''} />
//                 <div>
//                     <span class="var-price">${getCurrencySymbol(activeCurrency)}${(item?.price_adjustments[0]?.value) / 100}</span>
//                     <span class="var-entries">${item?.description} entries</span>
//                 </div>
//             </label>`
//             planDiv.innerHTML= content;
//             planDiv.querySelector(`#plan-${item?.id}`).addEventListener('change', () => handlePlanChange(item));
//           })
//     }else{
//        let parent = document.getElementById('subscription');
//             if (parent) {
//                 parent.remove();
//             }
//     }
// }

// const showVariantPlans = () => {
//     if (subscription_page_type == "product" && otherPlans?.length > 0) {

//         let mainWidget = `<div id="oneTime" class="oneTime purchase-optn-main">
//                 <div class="oneTime-body">
//                     <div id="oneTime-widget-box" class="oneTime-widget-box">
//                          <h3>One time payment</h3>
//                         <div id="oneTime-plans" class="var-pill-wrapper">
//                         </div>
//                     </div>
//                 </div>
//             </div>
//             <div id="subscription" class="subscription purchase-optn-main">
//             <div class="subscription-body">
//             <div id="btn-best-deal" class='best-deal-label'>
//                 <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <path d="M13.883 10.1248L9.93891 2.11008C9.85794 1.94554 9.72735 1.81057 9.56556 1.72423C9.40378 1.63788 9.21897 1.60451 9.0372 1.62883L6.42463 1.98469L9.11904 2.8834C9.38074 2.96941 9.60848 3.13608 9.76962 3.3595C9.93076 3.58293 10.017 3.85163 10.016 4.1271V13.0026L13.4836 11.2972C13.6918 11.1944 13.8507 11.0133 13.9256 10.7935C14.0005 10.5738 13.9852 10.3333 13.883 10.1248ZM5.42192 4.96708C5.53795 4.96708 5.64923 4.92099 5.73128 4.83894C5.81333 4.75689 5.85942 4.64561 5.85942 4.52958C5.85942 4.41355 5.81333 4.30227 5.73128 4.22022C5.64923 4.13818 5.53795 4.09208 5.42192 4.09208C5.37186 4.0917 5.32217 4.1006 5.27536 4.11833L5.57723 4.35896C5.6 4.3765 5.61902 4.39844 5.63315 4.42347C5.64729 4.4485 5.65625 4.47612 5.65952 4.50468C5.66278 4.53324 5.66028 4.56216 5.65216 4.58974C5.64403 4.61731 5.63046 4.64298 5.61223 4.66521C5.59187 4.691 5.56596 4.71187 5.53642 4.72626C5.50687 4.74065 5.47447 4.74819 5.44161 4.74833C5.39215 4.74874 5.34413 4.7317 5.30598 4.70021L4.99317 4.44864C4.98691 4.47516 4.98397 4.50234 4.98442 4.52958C4.98476 4.64551 5.03096 4.75659 5.11294 4.83856C5.19491 4.92054 5.30599 4.96674 5.42192 4.96708Z" fill="#FCA6FC"/>
//                     <path d="M8.98094 3.30024L5.49188 2.13649C5.44722 2.12117 5.39873 2.12117 5.35406 2.13649L3.54938 2.73805L4.90781 3.82524C5.05647 3.71503 5.23683 3.65594 5.42188 3.6568C5.61217 3.65608 5.79754 3.71719 5.95011 3.83092C6.10267 3.94465 6.21417 4.10485 6.26783 4.28742C6.32149 4.46999 6.31441 4.66505 6.24765 4.84325C6.18088 5.02144 6.05805 5.17313 5.89764 5.2755C5.73723 5.37786 5.54791 5.42536 5.35817 5.41084C5.16843 5.39632 4.98854 5.32058 4.84557 5.195C4.7026 5.06942 4.60427 4.90081 4.5654 4.71453C4.52652 4.52826 4.54919 4.33439 4.63 4.16211L3.05719 2.90211L1.865 3.30024C1.69034 3.35742 1.53828 3.46844 1.4306 3.61738C1.32293 3.76631 1.26518 3.94552 1.26563 4.1293V13.063C1.26594 13.295 1.35823 13.5174 1.52225 13.6814C1.68628 13.8454 1.90866 13.9377 2.14063 13.938H8.70313C8.92766 13.9398 9.14412 13.8544 9.30692 13.6997C9.46972 13.5451 9.56617 13.3333 9.57594 13.109C9.57752 13.0937 9.57825 13.0784 9.57813 13.063V4.1293C9.5786 3.94582 9.52111 3.76688 9.41387 3.618C9.30663 3.46912 9.15512 3.35791 8.98094 3.30024ZM3.32188 7.2443C3.49268 7.07384 3.71731 6.96788 3.95748 6.94448C4.19765 6.92107 4.43851 6.98167 4.63902 7.11594C4.83952 7.25021 4.98726 7.44985 5.05707 7.68084C5.12688 7.91183 5.11444 8.15988 5.02186 8.38273C4.92928 8.60557 4.7623 8.78943 4.54937 8.90296C4.33643 9.01649 4.09072 9.05267 3.8541 9.00535C3.61747 8.95803 3.40458 8.83012 3.25169 8.64342C3.0988 8.45673 3.01537 8.2228 3.01563 7.98149C3.0162 7.70492 3.12632 7.43986 3.32188 7.2443ZM3.47719 11.5077C3.44837 11.5081 3.41977 11.5027 3.39309 11.4918C3.3664 11.4809 3.34219 11.4647 3.32188 11.4443C3.30159 11.4241 3.2855 11.4 3.27451 11.3736C3.26353 11.3471 3.25788 11.3187 3.25788 11.2901C3.25788 11.2614 3.26353 11.2331 3.27451 11.2066C3.2855 11.1801 3.30159 11.1561 3.32188 11.1359L7.21344 7.2443C7.2336 7.22363 7.25766 7.20716 7.28423 7.19586C7.3108 7.18456 7.33935 7.17864 7.36823 7.17846C7.3971 7.17828 7.42573 7.18383 7.45244 7.1948C7.47915 7.20576 7.50342 7.22192 7.52384 7.24234C7.54425 7.26276 7.56041 7.28703 7.57138 7.31374C7.58235 7.34045 7.5879 7.36907 7.58772 7.39795C7.58753 7.42682 7.58162 7.45537 7.57032 7.48194C7.55902 7.50851 7.54255 7.53258 7.52188 7.55274L3.63031 11.4443C3.61043 11.4647 3.58661 11.4809 3.56029 11.4918C3.53396 11.5027 3.50568 11.5081 3.47719 11.5077ZM7.52188 11.4443C7.35107 11.6148 7.12644 11.7207 6.88627 11.7441C6.6461 11.7675 6.40524 11.7069 6.20474 11.5727C6.00424 11.4384 5.85649 11.2387 5.78668 11.0078C5.71687 10.7768 5.72932 10.5287 5.82189 10.3059C5.91447 10.083 6.08145 9.89917 6.29439 9.78564C6.50732 9.67211 6.75303 9.63592 6.98966 9.68325C7.22628 9.73057 7.43918 9.85848 7.59207 10.0452C7.74496 10.2319 7.82838 10.4658 7.82813 10.7071C7.82877 10.8442 7.80201 10.98 7.74942 11.1066C7.69683 11.2332 7.61947 11.348 7.52188 11.4443Z" fill="white"/>
//                     <path d="M6.78469 10.0996C6.66439 10.0993 6.54668 10.1346 6.44647 10.2011C6.34625 10.2677 6.26803 10.3625 6.22172 10.4735C6.1754 10.5845 6.16307 10.7068 6.18629 10.8248C6.2095 10.9429 6.26722 11.0514 6.35213 11.1366C6.43704 11.2218 6.54533 11.2799 6.66329 11.3036C6.78124 11.3272 6.90356 11.3153 7.01475 11.2694C7.12595 11.2235 7.22102 11.1456 7.28793 11.0456C7.35484 10.9457 7.39058 10.8281 7.39063 10.7078C7.39061 10.5464 7.32694 10.3915 7.21344 10.2768C7.15717 10.2205 7.09032 10.1759 7.01675 10.1455C6.94317 10.1151 6.86431 10.0995 6.78469 10.0996ZM4.49 8.41306C4.60351 8.2988 4.66721 8.14427 4.66721 7.98322C4.66721 7.82216 4.60351 7.66764 4.49 7.55337C4.40517 7.46831 4.297 7.41033 4.17919 7.38678C4.06138 7.36323 3.93924 7.37516 3.82821 7.42107C3.71719 7.46698 3.62229 7.54479 3.55552 7.64467C3.48875 7.74454 3.45312 7.86199 3.45313 7.98212C3.45268 8.10245 3.488 8.22019 3.5546 8.3204C3.62121 8.42061 3.71609 8.49877 3.8272 8.54495C3.93831 8.59113 4.06064 8.60325 4.17865 8.57976C4.29666 8.55628 4.40504 8.49826 4.49 8.41306Z" fill="white"/>
//                   </svg>
//                   Best Deal
//               </div>
//                 <div id="subscription-widget-box" class="subscription-widget-box">
//                         <h3>Subscribe and save</h3>
//                         <div id="subscription-plans">
                           
//                         </div>
//                 </div>
//               <div class="main-widget" id="main-widget">
//                         <div class="selected-widget-Plan">
//                           <div id="left-side-widget">
//                               <h2 id="product-price">${getCurrencySymbol(activeCurrency)}${(selectedPlan.price_adjustments[0].value)/100}<sub id="purchase-type">/${selectedPlan.options[0].value.split(' ')[0]}</sub></h2>
//                          </div>
//                           <div id="right-side-widget">
//                             <ul id="widget-list">
//                                 <li>Cancel at any time after complete your minimum billing cycles.</li>
//                                 <li id="description">${selectedPlan.description== null ? "Your description is here": `${selectedPlan.description} Entries`}</li>
//                             </ul>
//                           </div>
//                         </div>
//                 </div>
//             </div>
//         </div>`

//         let subscriptionBlock = document.getElementById('subscription-app-block')
//         subscriptionBlock.innerHTML = mainWidget;
      
//         generatePlans();
//     }
// }

// const cartClear=()=>{
//         var form = document.querySelectorAll('form[action*="/cart/add"]');

//         form.forEach((item) => {
//             var sellingPlanInputs = item.querySelectorAll(
//                 'input[name="selling_plan"]'
//             );

//             if (sellingPlanInputs.length > 0) {
//                 sellingPlanInputs.forEach(function (input) {
//                     input.value = "";
//                 });
//             }
//         })
// }

// const handlePlanChange = (newPlan) => {
//   console.log("newPlan===", newPlan)
//      let hasActive = document.getElementsByClassName('active');
//     console.log("hasActive==", hasActive);
    
//     // Convert the HTMLCollection to an array to use map or forEach
//     Array.from(hasActive).forEach(itm => {
//       itm.classList.remove('active');
//     });
    
//     let nowActive = document.getElementById(`${newPlan.id}`);
//     if (nowActive) {
//     nowActive.classList.add('active');
//     console.log("nowActive==", nowActive);
//   } 
//   let checkOnetime= newPlan?.options[0]?.value?.split(' ')[0] == 'year'
//   console.log("checkOnetime==", checkOnetime)
//   let dealWidget= document.getElementById('main-widget')
//   selectedPlan = newPlan
//    sendDataToCart(selectedPlan)
//   if(checkOnetime){
//   dealWidget.style.display= 'none';
//   }else{
//     dealWidget.style.display= 'block';
//      changeWidgetData()
//   }
// }


// const changeWidgetData = () => {
//     let priceDiv = document.getElementById('product-price')
//     let typeDiv = document.getElementById('purchase-type')
//     let descriptionDiv = document.getElementById('description')
//     const planValue = selectedPlan.options?.[0]?.value?.trim() || '';
//     typeDiv.innerText = planValue ? `/${planValue.split(' ')[0]}` : '---';
//     priceDiv.innerText = `${getCurrencySymbol(activeCurrency)}${(selectedPlan?.price_adjustments[0]?.value)/100}`
//     priceDiv.appendChild(typeDiv);

//     if (selectedPlan.description == null) {
//         descriptionDiv.innerText = "Your description is here";
//         // descriptionDiv.style.display="none"
//     } else {
//         descriptionDiv.style.display = "block"
//         descriptionDiv.innerText = selectedPlan.description;
//     }
//     console.log("selectedPlan in widget", selectedPlan)
//     console.log("priceDiv=", priceDiv, typeDiv, description)
// }

// if (otherPlans?.length > 0 || oneTimePlans?.length > 0) {
//     showVariantPlans();
// } else {
//     let subscriptionBlock = document.getElementById('subscription-app-block')
//     subscriptionBlock.innerHTML = '';
// }
// console.log("otherPlans====", otherPlans)









































// console.log("js---=")
// // let serverPath = "https://tract-estonia-tour-marijuana.trycloudflare.com";
// let activeCurrency = Shopify?.currency?.active;
// let purchaseOption = "oneTime-purchase"
// let allSellingPlans = []
// let oneTimePlans = []
// let otherPlans = []

// let shop = Shopify.shop;
// let currentUrl = window.location.href;
// let selectedPlan;
// if (filtered_selling_plan_groups?.length > 0) {
//     filtered_selling_plan_groups?.forEach((item) => {
//         allSellingPlans?.push(...item?.selling_plans)
//     })
//   console.log("allSellingPlans=", allSellingPlans)
//   allSellingPlans?.map(item=>{
//      console.log("item?.options[0]?.value=", item)
//      let interval= item?.options[0]?.value?.split(' ')?.[0]
//       console.log("interval=", interval)
//       if(interval == 'year'){
//          oneTimePlans?.push(item)
//       }else{
//         otherPlans?.push(item)
//       }
//   })
// }

// console.log("otherPlans====", otherPlans)
// console.log("oneTimePlans====", oneTimePlans)
// // otherPlans = allSellingPlans;
// selectedPlan = otherPlans[0]


// if (currentUrl.includes("account")) {
//     console.log("hello from account page")
//     let targetElement = document.getElementsByTagName("a");
//     let targetArray = Array.from(targetElement);
//     targetArray.forEach((item) => {
//         let url = item.href;
//         if (url.includes("account/addresses")) {
//             let button = document.createElement("button");

//             let linebreak = document.createElement("br");
//             button.innerHTML = "Manage Subscriptions";

//             const id = ShopifyAnalytics.meta.page.customerId;
//             console.log("id==", id)
//             button.addEventListener("click", function () {
//                 const targetUrl = `https://${shop}/apps/subscription?cid=${id}`;
//                 // const targetUrl =  `https://playgroundstoree.myshopify.com/apps/subscription?cid=${id}`;
//                 console.log("targetUrl==", targetUrl)
//                 targetUrl ? window.location.href = targetUrl : "";
//                 //    fetchData(id);
//             });

//             item.parentNode.insertBefore(button, item);
//             button.insertAdjacentHTML("afterend", "<br>");
//         }
//     });
// }


// const getCurrencySymbol = (currency) => {
//     const symbol = new Intl.NumberFormat("en", { style: "currency", currency })
//         .formatToParts()
//         .find((x) => x.type === "currency");
//     return symbol && symbol.value;
// };
// const calDiscountedPrice = (discount) => {
//   console.log("alert(discount", discount)
//     let productPrice = productJson?.price / 100;
//     console.log("productPrice=", productPrice)
//     let newPrice = productPrice;
//     let discountAmt = 0
//     if (discount > 0 || discount != undefined) {
//         discountAmt = (productPrice * discount) / 100;
//     }
//   console.log(discountAmt, typeof discountAmt, parseFloat((newPrice - parseFloat(discountAmt)).toFixed(2)))
//     return parseFloat((newPrice - parseFloat(discountAmt)).toFixed(2));
// }
// const generatePlans = () => {

//     if (otherPlans?.length > 0) {
//         // console.log("otherplans=", otherPlans)
//         let subsciptionPlansDiv = document.getElementsByClassName('selectedPlan')[0]

//         let plansdropdown = document.createElement('div');
//         plansdropdown.className = "selling-plans-list";
//         plansdropdown.id = `subscription-plans-list`;
//         subsciptionPlansDiv.appendChild(plansdropdown)

//         // let dropdownHead = document.createElement('div');
//         // dropdownHead.innerHTML = `<p>Pay as you go for sub</p>`
//         // plansdropdown.appendChild(dropdownHead)

//         otherPlans?.forEach((item, index) => {
//             let planDiv = document.createElement('div');
//             planDiv.id = item?.id;
//             planDiv.className = "plan-option"
//             plansdropdown.appendChild(planDiv);
//             planDiv.onclick = () => handlePlanClick(item);

//             let planTitle = document.createElement('div');
//             planTitle.id = 'selling-plan-title';
//             planTitle.className = "selling-plan-title"
//             let planName = document.createTextNode(`${item?.name}`);
//             planDiv.appendChild(planTitle);
//             planTitle.appendChild(planName);
//             let planPrice = document.createElement('div');
//             planPrice.id = 'selling-plan-price';
//             planPrice.className = "selling-plan-price"
//            let price =document.createTextNode(`${getCurrencySymbol(activeCurrency)}${(item?.price_adjustments[0]?.value)/100}`);
//             planDiv.appendChild(planPrice);
//            planPrice.appendChild(price);
//             if (index == 0) {
//                 planDiv.classList.add("active-plan")
//             }
//         })
//     }
// }
// const showVariantPlans = () => {
//     if (subscription_page_type == "product" && otherPlans?.length > 0) {

//         let mainWidget = `<div id="subscription purchase-optn-main" class="subscription purchase-optn-main">
//             <div class="subscription-body">
//             <div id="btn-best-deal" class='best-deal-label'>
//                 <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <path d="M13.883 10.1248L9.93891 2.11008C9.85794 1.94554 9.72735 1.81057 9.56556 1.72423C9.40378 1.63788 9.21897 1.60451 9.0372 1.62883L6.42463 1.98469L9.11904 2.8834C9.38074 2.96941 9.60848 3.13608 9.76962 3.3595C9.93076 3.58293 10.017 3.85163 10.016 4.1271V13.0026L13.4836 11.2972C13.6918 11.1944 13.8507 11.0133 13.9256 10.7935C14.0005 10.5738 13.9852 10.3333 13.883 10.1248ZM5.42192 4.96708C5.53795 4.96708 5.64923 4.92099 5.73128 4.83894C5.81333 4.75689 5.85942 4.64561 5.85942 4.52958C5.85942 4.41355 5.81333 4.30227 5.73128 4.22022C5.64923 4.13818 5.53795 4.09208 5.42192 4.09208C5.37186 4.0917 5.32217 4.1006 5.27536 4.11833L5.57723 4.35896C5.6 4.3765 5.61902 4.39844 5.63315 4.42347C5.64729 4.4485 5.65625 4.47612 5.65952 4.50468C5.66278 4.53324 5.66028 4.56216 5.65216 4.58974C5.64403 4.61731 5.63046 4.64298 5.61223 4.66521C5.59187 4.691 5.56596 4.71187 5.53642 4.72626C5.50687 4.74065 5.47447 4.74819 5.44161 4.74833C5.39215 4.74874 5.34413 4.7317 5.30598 4.70021L4.99317 4.44864C4.98691 4.47516 4.98397 4.50234 4.98442 4.52958C4.98476 4.64551 5.03096 4.75659 5.11294 4.83856C5.19491 4.92054 5.30599 4.96674 5.42192 4.96708Z" fill="#FCA6FC"/>
//                     <path d="M8.98094 3.30024L5.49188 2.13649C5.44722 2.12117 5.39873 2.12117 5.35406 2.13649L3.54938 2.73805L4.90781 3.82524C5.05647 3.71503 5.23683 3.65594 5.42188 3.6568C5.61217 3.65608 5.79754 3.71719 5.95011 3.83092C6.10267 3.94465 6.21417 4.10485 6.26783 4.28742C6.32149 4.46999 6.31441 4.66505 6.24765 4.84325C6.18088 5.02144 6.05805 5.17313 5.89764 5.2755C5.73723 5.37786 5.54791 5.42536 5.35817 5.41084C5.16843 5.39632 4.98854 5.32058 4.84557 5.195C4.7026 5.06942 4.60427 4.90081 4.5654 4.71453C4.52652 4.52826 4.54919 4.33439 4.63 4.16211L3.05719 2.90211L1.865 3.30024C1.69034 3.35742 1.53828 3.46844 1.4306 3.61738C1.32293 3.76631 1.26518 3.94552 1.26563 4.1293V13.063C1.26594 13.295 1.35823 13.5174 1.52225 13.6814C1.68628 13.8454 1.90866 13.9377 2.14063 13.938H8.70313C8.92766 13.9398 9.14412 13.8544 9.30692 13.6997C9.46972 13.5451 9.56617 13.3333 9.57594 13.109C9.57752 13.0937 9.57825 13.0784 9.57813 13.063V4.1293C9.5786 3.94582 9.52111 3.76688 9.41387 3.618C9.30663 3.46912 9.15512 3.35791 8.98094 3.30024ZM3.32188 7.2443C3.49268 7.07384 3.71731 6.96788 3.95748 6.94448C4.19765 6.92107 4.43851 6.98167 4.63902 7.11594C4.83952 7.25021 4.98726 7.44985 5.05707 7.68084C5.12688 7.91183 5.11444 8.15988 5.02186 8.38273C4.92928 8.60557 4.7623 8.78943 4.54937 8.90296C4.33643 9.01649 4.09072 9.05267 3.8541 9.00535C3.61747 8.95803 3.40458 8.83012 3.25169 8.64342C3.0988 8.45673 3.01537 8.2228 3.01563 7.98149C3.0162 7.70492 3.12632 7.43986 3.32188 7.2443ZM3.47719 11.5077C3.44837 11.5081 3.41977 11.5027 3.39309 11.4918C3.3664 11.4809 3.34219 11.4647 3.32188 11.4443C3.30159 11.4241 3.2855 11.4 3.27451 11.3736C3.26353 11.3471 3.25788 11.3187 3.25788 11.2901C3.25788 11.2614 3.26353 11.2331 3.27451 11.2066C3.2855 11.1801 3.30159 11.1561 3.32188 11.1359L7.21344 7.2443C7.2336 7.22363 7.25766 7.20716 7.28423 7.19586C7.3108 7.18456 7.33935 7.17864 7.36823 7.17846C7.3971 7.17828 7.42573 7.18383 7.45244 7.1948C7.47915 7.20576 7.50342 7.22192 7.52384 7.24234C7.54425 7.26276 7.56041 7.28703 7.57138 7.31374C7.58235 7.34045 7.5879 7.36907 7.58772 7.39795C7.58753 7.42682 7.58162 7.45537 7.57032 7.48194C7.55902 7.50851 7.54255 7.53258 7.52188 7.55274L3.63031 11.4443C3.61043 11.4647 3.58661 11.4809 3.56029 11.4918C3.53396 11.5027 3.50568 11.5081 3.47719 11.5077ZM7.52188 11.4443C7.35107 11.6148 7.12644 11.7207 6.88627 11.7441C6.6461 11.7675 6.40524 11.7069 6.20474 11.5727C6.00424 11.4384 5.85649 11.2387 5.78668 11.0078C5.71687 10.7768 5.72932 10.5287 5.82189 10.3059C5.91447 10.083 6.08145 9.89917 6.29439 9.78564C6.50732 9.67211 6.75303 9.63592 6.98966 9.68325C7.22628 9.73057 7.43918 9.85848 7.59207 10.0452C7.74496 10.2319 7.82838 10.4658 7.82813 10.7071C7.82877 10.8442 7.80201 10.98 7.74942 11.1066C7.69683 11.2332 7.61947 11.348 7.52188 11.4443Z" fill="white"/>
//                     <path d="M6.78469 10.0996C6.66439 10.0993 6.54668 10.1346 6.44647 10.2011C6.34625 10.2677 6.26803 10.3625 6.22172 10.4735C6.1754 10.5845 6.16307 10.7068 6.18629 10.8248C6.2095 10.9429 6.26722 11.0514 6.35213 11.1366C6.43704 11.2218 6.54533 11.2799 6.66329 11.3036C6.78124 11.3272 6.90356 11.3153 7.01475 11.2694C7.12595 11.2235 7.22102 11.1456 7.28793 11.0456C7.35484 10.9457 7.39058 10.8281 7.39063 10.7078C7.39061 10.5464 7.32694 10.3915 7.21344 10.2768C7.15717 10.2205 7.09032 10.1759 7.01675 10.1455C6.94317 10.1151 6.86431 10.0995 6.78469 10.0996ZM4.49 8.41306C4.60351 8.2988 4.66721 8.14427 4.66721 7.98322C4.66721 7.82216 4.60351 7.66764 4.49 7.55337C4.40517 7.46831 4.297 7.41033 4.17919 7.38678C4.06138 7.36323 3.93924 7.37516 3.82821 7.42107C3.71719 7.46698 3.62229 7.54479 3.55552 7.64467C3.48875 7.74454 3.45312 7.86199 3.45313 7.98212C3.45268 8.10245 3.488 8.22019 3.5546 8.3204C3.62121 8.42061 3.71609 8.49877 3.8272 8.54495C3.93831 8.59113 4.06064 8.60325 4.17865 8.57976C4.29666 8.55628 4.40504 8.49826 4.49 8.41306Z" fill="white"/>
//                   </svg>
//                   Best Deal
//               </div>
//                 <div id="subscription-widget-box" class="subscription-widget-box">
//                     <div id="option-two">
//                         <input type="radio" id="two" value="subscription" name="choose-option" onchange="handlePurchaseOption(event)" />
//                         <span class="checkmark"></span>
//                         <label for="two" class="sub-label">Subscribe and save</label>
                        
//                         <div id="subscription-dropdown">
//                             <div class="selectedPlan">
//                                 <div class="dropdown-btn" onclick="handleDropdown()">
//                                     <div id="subscription-selectedPlan-title" class="selectedPlan-title">
//                                     ${otherPlans[0]?.name}
//                                     </div>
//                                     <div id="subscription-selectedPlan-price" class="selectedPlan-price">
//                                     ${getCurrencySymbol(activeCurrency)}${(otherPlans[0]?.price_adjustments[0]?.value)/100}
//                                        <svg width="11" height="7" viewBox="0 0 11 7" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                           <path d="M5.27155 6.55413C5.44227 6.54979 5.60544 6.47669 5.72947 6.34899L10.0394 1.84763C10.1709 1.70913 10.2466 1.51954 10.2499 1.32043C10.2531 1.12131 10.1837 0.92892 10.0568 0.785414C9.92987 0.641907 9.75584 0.558988 9.57283 0.554849C9.38981 0.550711 9.21276 0.625687 9.08047 0.763332L5.25 4.76648L1.41953 0.763332C1.28724 0.625687 1.11019 0.550711 0.927174 0.55485C0.744163 0.558989 0.570126 0.641908 0.44321 0.785415C0.316294 0.928921 0.246853 1.12131 0.250109 1.32043C0.253365 1.51954 0.329052 1.70913 0.460579 1.84763L4.77053 6.34899C4.83726 6.41779 4.91596 6.47138 5.002 6.50661C5.08804 6.54184 5.17969 6.55799 5.27155 6.55413Z" fill="#25272A"/>
//                                       </svg>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             <div class="main-widget" id="main-widget">
//                         <div class="selected-widget-Plan">
//                           <div id="left-side-widget">
//                               <h2 id="product-price">${getCurrencySymbol(activeCurrency)}${(selectedPlan.price_adjustments[0].value)/100}<sub id="purchase-type">/${selectedPlan.options[0].value.split(' ')[0]}</sub></h2>
                           
//                           </div>
//                           <div id="right-side-widget">
//                             <ul id="widget-list">
//                                 <li>Cancel at any time after complete your minimum billing cycles.</li>
//                                 <li id="description">${selectedPlan.description== null ? "Your description is here": selectedPlan.description}</li>
//                             </ul>
//                           </div>
//                         </div>
                        
//             </div>
//             </div>
//         </div>`

//         let subscriptionBlock = document.getElementById('subscription-app-block')
//         subscriptionBlock.innerHTML = mainWidget;
      
//       let myRadio = document.getElementById("two")
//         generatePlans();
//       myRadio.addEventListener('click',function (){
//       const variantLabels = document.querySelectorAll('.variants-label');
//       console.log("variantLabels=", variantLabels)
//          variantLabels.forEach((label) => {
//           label.classList.remove('active');
//           const input = label.querySelector('input');
//             input.removeAttribute("checked")
//            myRadio.classList.remove('active')
//           });
//          setTimeout(()=>{
//             myRadio.checked= true
//            myRadio.classList.add('active')
//          }, 300)
//       })
//     }
// }
// const handleVariantChange = () => {
//       console.log("selectedVariant==*******")
//       let myRadio = document.getElementById("two")
//       console.log("myRadio==", myRadio)
//       if(myRadio){
//         myRadio.checked= false
//         myRadio.classList.remove('active')
//       }
       
//         // myRadio.removeAttribute("checked")
//     // if (
//     //     selectedVariant != window.ShopifyAnalytics.meta["selectedVariantId"]
//     // ) {
//     //     // updateHiddenInputForAddToCartForm("remove");

//     //     let plan_array = [];
//     //     let selectedVariantData;


//     //     if (window.ShopifyAnalytics.meta["selectedVariantId"] != undefined) {
//     //         selectedVariant = window.ShopifyAnalytics.meta["selectedVariantId"];
//     //         console.log("window.ShopifyAnalytics.meta==", selectedVariant, window.ShopifyAnalytics.meta["selectedVariantId"])
//     //         selectedVariantData =
//     //             Revlytic.variant[
//     //             "VID_" + window.ShopifyAnalytics.meta["selectedVariantId"]
//     //             ];
//     //         console.log("selectedVariantData=", selectedVariantData)
//     //     } else {
//     //         console.log("window.ShopifyAnalytics.meta==in else", selectedVariant, window.ShopifyAnalytics.meta["selectedVariantId"])
//     //         selectedVariantData =
//     //             Revlytic.variant[
//     //             "VID_" + selectedVariant
//     //             ];
//     //         console.log("selectedVariantData=", selectedVariantData)
//     //     }

//     //     if (
//     //         selectedVariantData &&
//     //         selectedVariantData.allocations.selling_plans.list != {}
//     //     ) {
//     //         let sellingPlanIdList = Object.keys(
//     //             selectedVariantData.allocations.selling_plans.list
//     //         );
//     //         console.log("sellingPlanIdList=", sellingPlanIdList, allSellingPlans)
//     //         sellingPlanIdList.map((item) => {
//     //             let rawId = item.split("ID_")[1];
//     //             console.log("rawId", rawId)
//     //             let getData = allSellingPlans.find(
//     //                 (itm) => itm.id == rawId
//     //             );
//     //             getData != undefined &&
//     //                 plan_array.push({
//     //                     ...getData,
//     //                     ...Revlytic.selling_plans.list[item],
//     //                 });
//     //         });

//     //         otherPlans = plan_array;
//     //         selectedPlan = otherPlans[0]
//     //         console.log("plan_array==**********", plan_array, selectedPlan)
//     //         if (otherPlans.length > 0) {
//     //             showVariantPlans();
//     //         } else {
//     //             let subscriptionBlock = document.getElementById('subscription-app-block')
//     //             subscriptionBlock.innerHTML = '';
//     //         }

//     //     }

//     // }

// }




// handleVariantChange()


// document.addEventListener("change", (e) => handleVariantChange());


// if (otherPlans.length > 0) {
//     showVariantPlans();
// } else {
//     let subscriptionBlock = document.getElementById('subscription-app-block')
//     subscriptionBlock.innerHTML = '';
// }
// console.log("otherPlans====", otherPlans)



// const sendDataToCart = (plan) => {
//     var form = document.querySelectorAll('form[action*="/cart/add"]');
//     form.forEach((item) => {
//         var sellingPlanInputs = item.querySelectorAll(
//             'input[name="selling_plan"]'
//         );
//         if (sellingPlanInputs.length === 0) {
//             var newHiddenInput = document.createElement("input");
//             newHiddenInput.type = "hidden";
//             newHiddenInput.name = "selling_plan";
//             newHiddenInput.value = plan?.id;
//             item.appendChild(newHiddenInput);
//         } else {
//             sellingPlanInputs.forEach(function (input) {
//                 input.value = plan?.id;
//             });
//         }
//     });
// }

// const handlePurchaseOption = (e) => {
//     purchaseOption = e.target?.value;
//   console.log(e)
//     let subDropdownDiv = document.getElementById('subscription-dropdown')
//     if (e.target.value == "subscription") {
//         selectedPlan = otherPlans[0]
//         sendDataToCart(selectedPlan)
//         subDropdownDiv.style.display = "block";
//         document.getElementById('main-widget').style.display = "block";
//         let input = document.getElementById('two')
//       console.log("input=", input)
//         input.checked= true;
//  console.log("input=", input)
//     } else {
//         subDropdownDiv.style.display = "none";
//         var form = document.querySelectorAll('form[action*="/cart/add"]');

//         form.forEach((item) => {
//             var sellingPlanInputs = item.querySelectorAll(
//                 'input[name="selling_plan"]'
//             );

//             if (sellingPlanInputs.length > 0) {
//                 sellingPlanInputs.forEach(function (input) {
//                     input.value = "";
//                 });
//             }
//         })
//     }

// }
// const changeWidgetData = () => {
//     let priceDiv = document.getElementById('product-price')
//     let typeDiv = document.getElementById('purchase-type')
//     let descriptionDiv = document.getElementById('description')
//     const planValue = selectedPlan.options?.[0]?.value?.trim() || '';
//     typeDiv.innerText = planValue ? `/${planValue.split(' ')[0]}` : '---';
//     priceDiv.innerText = `${getCurrencySymbol(activeCurrency)}${(selectedPlan?.price_adjustments[0]?.value)/100}`
//     priceDiv.appendChild(typeDiv);

//     if (selectedPlan.description == null) {
//         descriptionDiv.innerText = "Your description is here";
//         // descriptionDiv.style.display="none"
//     } else {
//         descriptionDiv.style.display = "block"
//         descriptionDiv.innerText = selectedPlan.description;
//     }
//     console.log("selectedPlan", selectedPlan)
//     console.log("priceDiv=", priceDiv, typeDiv, description)
// }

// const handlePlanClick = (newPlan) => {
//     purchaseOption == "oneTime-purchase" ? "" : "";
//     let listDiv = document.getElementById(`${purchaseOption}-plans-list`)
//     listDiv?.classList.contains('show') ? listDiv.classList.remove('show') : listDiv.classList.add('show')
//     if (selectedPlan?.id != newPlan?.id) {
//         let alreadyActivePlan = document.getElementById(`${selectedPlan?.id}`)
//         alreadyActivePlan?.classList.contains('active-plan') ? alreadyActivePlan.classList.remove('active-plan') : "";
//         selectedPlan = newPlan;
//         let newActivePlan = document?.getElementById(`${newPlan?.id}`)
//         newActivePlan?.classList.add('active-plan')

//         let titleDiv = document.getElementById(`${purchaseOption}-selectedPlan-title`);
//         if (titleDiv) {
//             titleDiv.innerText = selectedPlan?.name;
//         }

//         let priceDiv = document.getElementById(`${purchaseOption}-selectedPlan-price`);
//         if (priceDiv) {
//             priceDiv.innerText = `${getCurrencySymbol(activeCurrency)}${(selectedPlan?.price_adjustments[0]?.value)/100}`;
//         }
//       let html= ` ${getCurrencySymbol(activeCurrency)}${(selectedPlan?.price_adjustments[0]?.value)/100}<svg width="11" height="7" viewBox="0 0 11 7" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                           <path d="M5.27155 6.55413C5.44227 6.54979 5.60544 6.47669 5.72947 6.34899L10.0394 1.84763C10.1709 1.70913 10.2466 1.51954 10.2499 1.32043C10.2531 1.12131 10.1837 0.92892 10.0568 0.785414C9.92987 0.641907 9.75584 0.558988 9.57283 0.554849C9.38981 0.550711 9.21276 0.625687 9.08047 0.763332L5.25 4.76648L1.41953 0.763332C1.28724 0.625687 1.11019 0.550711 0.927174 0.55485C0.744163 0.558989 0.570126 0.641908 0.44321 0.785415C0.316294 0.928921 0.246853 1.12131 0.250109 1.32043C0.253365 1.51954 0.329052 1.70913 0.460579 1.84763L4.77053 6.34899C4.83726 6.41779 4.91596 6.47138 5.002 6.50661C5.08804 6.54184 5.17969 6.55799 5.27155 6.55413Z" fill="#25272A"/>
//                                       </svg>`
//       priceDiv.innerHTML= html;
//         sendDataToCart(newPlan)
//         changeWidgetData();
//     }
// }



// const handleDropdown = () => {
//     let listDiv = document.getElementById(`${purchaseOption}-plans-list`)
//     listDiv?.classList.contains('show') ? listDiv.classList.remove('show') : listDiv.classList.add('show')
// }
