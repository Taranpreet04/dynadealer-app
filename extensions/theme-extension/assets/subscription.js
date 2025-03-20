console.log("js--__________new=");

let serverPath = "https://dynadealersapp.com";
// let serverPath = "https://predict-paste-influence-presented.trycloudflare.com";
let allProductId = [];
let allOffers = [];
let activeCurrency = Shopify?.currency?.active;
let shop = Shopify.shop;
let customerId = ShopifyAnalytics?.meta?.page?.customerId;
let membershipDetails;
let currentUrl = window.location.href;
let purchaseOption = "oneTime-purchase";
let selectedEntries;
let oneTimePrice = 0.0;
let subscriptionPrice = 0.0;
let allSellingPlans = [];
let oneTimePlans = [];
let otherPlans = [];
let oneTimeSelectedPlan;
let subscriptionSelectedPlan;
let giveawayProduct = false;
let inventory = 0;
let showMemebershipLevels = false;
let goldMembershipOffer = false;
let offerDuration = {};
let commanData;
let options = [
  { name: "Weekly", value: "week", class: "timePeriodList" },
  { name: "Monthly", value: "month", class: "timePeriodList" },
  { name: "Yearly", value: "year", class: "timePeriodList" },
];
let selectedTimePlans = [];
let selectedPlan;

if (currentUrl.includes("account")) {
  console.log("hello from account page");
  let targetElement = document.querySelector(".customer__title");
  if (targetElement) {
    let cusDiv = document.createElement("div");
    cusDiv.className = "mange-sub-container";
    cusDiv.innerHTML = `<div class='subscription-manage'>
                <div>
                <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"  viewBox="0 0 24 24" fill="transparent">
                  <path d="M16 17H21M18.5 14.5V19.5M12 19H6.2C5.0799 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2C3 7.0799 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H17.8C18.9201 5 19.4802 5 19.908 5.21799C20.2843 5.40973 20.5903 5.71569 20.782 6.09202C21 6.51984 21 7.0799 21 8.2V11M20.6067 8.26229L15.5499 11.6335C14.2669 12.4888 13.6254 12.9165 12.932 13.0827C12.3192 13.2295 11.6804 13.2295 11.0677 13.0827C10.3743 12.9165 9.73279 12.4888 8.44975 11.6335L3.14746 8.09863" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3>Manage Memberships</h3>
                </div>`;

    cusDiv.addEventListener("click", function () {
      const targetUrl = `https://${shop}/apps/subscription?cid=${customerId}`;
      targetUrl ? (window.location.href = targetUrl) : "";
    });
    targetElement.parentNode.insertBefore(cusDiv, targetElement);
    cusDiv.insertAdjacentHTML("afterend", "<br>");
  }
}

if (subscription_page_type == "product") {
  if (filtered_selling_plan_groups?.length > 0) {
    filtered_selling_plan_groups?.forEach((item) => {
      allSellingPlans?.push(...item?.selling_plans);
    });
    console.log("allSellingPlans==", allSellingPlans);
  }
  productJson?.selling_plan_groups?.map((itm) => {
    let name = itm?.name?.toLowerCase();
    name?.includes("level") ? (showMemebershipLevels = true) : "";
    name?.includes("offer for gold membership")
      ? (goldMembershipOffer = true)
      : "";
  });
  function capitalize(str) {
    return str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase();
  }
  const sendOnetimeDataToCart = (entry) => {
    let formInput = document.createElement("input");
    formInput.type = "hidden";
    formInput.name = "properties[entries]"; // Shopify format
    formInput.value = entry;
  
    let formInput2 = document.createElement("input");
    formInput2.type = "hidden";
    formInput2.name = "properties[plan-type]"; // Shopify format
    formInput2.value = "onetime";
  
    let productForms = document.querySelectorAll('form[action="/cart/add"]');
  
    productForms.forEach((form) => {
      if (!form) return;
  
      // Check if the 'entries' input already exists
      let entriesInput = form.querySelector('input[name="properties[entries]"]');
      if (entriesInput) {
        entriesInput.value = entry;
      } else {
        form.appendChild(formInput);
      }
  
      // Check if the 'plan-type' input already exists
      let typeInput = form.querySelector('input[name="properties[plan-type]"]');
      if (typeInput) {
        typeInput.value = "onetime";
      } else {
        form.appendChild(formInput2);
      }
    });
  
    console.log("Custom properties added to the cart form.");
  };
  const clearOnetimeProperties = () => {
    const productForms = document.querySelectorAll('form[action="/cart/add"]');
    
    productForms.forEach((form) => {
      // Check if 'entries' input exists and remove it
      const entriesInput = form.querySelector('input[name="properties[entries]"]');
      if (entriesInput) {
        entriesInput.remove();
      }
    
      // Check if 'plan-type' input exists and remove it
      const typeInput = form.querySelector('input[name="properties[plan-type]"]');
      if (typeInput) {
        typeInput.remove();
      }
    });
  };
  
  
  // const sendDataToCart = (plan) => {
  //   console.log("plan in cart", plan);
  //  if(plan){
  //   var form = document.querySelectorAll('form[action*="/cart/add"]');
  //   console.log("form==cart/add", form)
  //   form.forEach((item) => {
  //     var sellingPlanInputs = item.querySelectorAll(
  //       'input[name="selling_plan"]',
  //     );
  //     console.log("sellingPlanInputs", sellingPlanInputs)
  //     if (sellingPlanInputs.length === 0) {
  //       console.log("in cart if")
  //       var newHiddenInput = document.createElement("input");
  //       newHiddenInput.type = "hidden";
  //       newHiddenInput.name = "selling_plan";
  //       newHiddenInput.value = plan?.id;
  //       item.appendChild(newHiddenInput);
  //     } else {
  //       console.log("in cart else")
  //       sellingPlanInputs.forEach(function (input) {
  //         input.value = plan?.id;
  //       });
  //     }
  //   });
  //  }
  // };
  
  const sendDataToCart = (plan) => {
    console.log("plan in cart", plan);
    console.log("----------------------------------------------------",document.querySelector('[data-cart-notification]'));
    // Ensure the plan object and plan.id exist before proceeding
    if (!plan || !plan.id) {
      console.warn("Invalid plan data provided");
      return;
    }
  
    // Select all forms with /cart/add action
    var forms = document.querySelectorAll('form[action*="/cart/add"]');
    console.log("Forms found: ", forms.length);
  
    if (forms.length === 0) {
      console.warn("No cart/add forms found on the page.");
      return;
    }
  
    forms.forEach((form) => {
      if (!form) return;
  
      // Select existing selling plan inputs
      var sellingPlanInputs = form.querySelectorAll('input[name="selling_plan"]');
      console.log("Existing sellingPlanInputs:", sellingPlanInputs.length);
  
      if (sellingPlanInputs.length === 0) {
        console.log("Adding new hidden input for selling plan");
  
        var newHiddenInput = document.createElement("input");
        newHiddenInput.type = "hidden";
        newHiddenInput.name = "selling_plan";
        newHiddenInput.value = plan.id;
  console.log("newHiddenInput--", newHiddenInput)
        form.appendChild(newHiddenInput);
      } else {
        console.log("Updating existing selling plan input values");
        
        sellingPlanInputs.forEach((input) => {
          if (input) {
            input.value = plan.id;
            console.log("Updating--", input)
          }
        });
      }
    });
  };
  
  const cartClear = () => {
    var form = document.querySelectorAll('form[action*="/cart/add"]');

    form.forEach((item) => {
      var sellingPlanInputs = item.querySelectorAll(
        'input[name="selling_plan"]',
      );

      if (sellingPlanInputs.length > 0) {
        sellingPlanInputs.forEach(function (input) {
          // input.value = "";
          input.remove()
        });
      }
    });
  };

  const toIST = (dateString) => {
    const date = new Date(dateString);
    const offsetInMinutes = 330;
    return new Date(date.getTime() - offsetInMinutes * 60 * 1000);
  };
  const getEntries = (str) => {
    let data = JSON.parse(str);
    return data.entries;
  };
  const getCurrencySymbol = (currency) => {
    const symbol = new Intl.NumberFormat("en", { style: "currency", currency })
      .formatToParts()
      .find((x) => x.type === "currency");
    return symbol && symbol.value;
  };
  if (allSellingPlans?.length == 1) {
    if (allSellingPlans) {
      sendDataToCart(allSellingPlans[0]);
    }
  }else {
      if (allSellingPlans?.length > 1) {
       
        commanData = JSON.parse(allSellingPlans[0]?.description);
        console.log("commanData==", commanData);

        const setPriceAndEntries = (plan) => {
          console.log("plan= setPriceAndEntries== cart===", plan);
          let entries = getEntries(plan?.description);
          selectedEntries = entries;
          if (purchaseOption == "oneTime-purchase") {
            oneTimeSelectedPlan = plan;
            subscriptionSelectedPlan = otherPlans?.filter((itm) =>
              itm?.name?.includes(`-entries-${entries}`),
            )[0];
          } else {
            subscriptionSelectedPlan = plan;
            oneTimeSelectedPlan = oneTimePlans?.filter((itm) =>
              itm?.name?.includes(`-entries-${entries}`),
            )[0];
          }
          oneTimePrice = oneTimeSelectedPlan?.price_adjustments[0]?.value / 100;
          subscriptionPrice =
            subscriptionSelectedPlan?.price_adjustments[0]?.value / 100;
          let oneTimePriceDiv =
            document.getElementsByClassName("oneTimePrice")[0];
          let subscriptionPriceDiv =
            document.getElementsByClassName("subscriptionPrice")[0];
          oneTimePriceDiv.innerText = oneTimePrice
            ? `${getCurrencySymbol(activeCurrency)}${oneTimePrice}`
            : "";
          subscriptionPriceDiv.innerText = subscriptionPrice
            ? `${getCurrencySymbol(activeCurrency)}${subscriptionPrice}`
            : "";

          // if (
          //   (purchaseOption == "oneTime-purchase" && !oneTimePrice) ||
          //   (purchaseOption == "subscription-purchase" && !subscriptionPrice)
          // ) {
          //   handleOnetimePlan()
          // }
        };
        const setCartProperties = () => {
            subscriptionSelectedPlan = otherPlans?.filter((itm) =>
              itm?.name?.includes(`-entries-${selectedEntries}`),
            )[0];
            console.log("In Cart properties change")
            console.log("subscriptionSelectedPlan==", subscriptionSelectedPlan)
            console.log("purchaseOption==", purchaseOption)
            console.log("selectedEntries==", selectedEntries)
            if (purchaseOption == "oneTime-purchase") {
              handleOnetimePlan(selectedEntries)
            } else {
              if(subscriptionSelectedPlan){
                handlePlanChange(subscriptionSelectedPlan);
              }
            }
        };

        function handlePurchaseType(event) {
          purchaseOption = event.target.value;
         
          let div = document.getElementsByClassName('additional-detail')[0]
          // console.log("div=====", div, event.target.value)
          if (div) {
            if (event.target.value == "oneTime-purchase") {
              cartClear()
              div.style.display = 'none';
            } else {
              div.style.display = 'block';
              clearOnetimeProperties()
            }
          }
          setCartProperties();
        }

        const showVariantPlans = () => {
          if (
            subscription_page_type == "product" &&
            (otherPlans?.length > 0 || oneTimePlans?.length > 0)
          ) {
            let mainWidget = `
                    <div id="oneTime" class="oneTime purchase-optn-main">
                <div class='other-options'>
                <h5>Purchase options</h5>
                        <div id="options" class="options">
                         <div class='onetime-purchase'>
                            <input type="radio" id="onetime-purchase" value='oneTime-purchase' name="purchase-option" 
              onchange='handlePurchaseType(event)'/>
                            <label for="onetime-purchase">
                            <div class='label'>One-time Purchase <span class='oneTimePrice'></span></div>
                            </label>
                        </div>
                        <div class='subscription-purchase'>
                            <input type="radio" id="subscription-purchase"  value='subscription-purchase' name="purchase-option"
              onchange='handlePurchaseType(event)' />
                            <label for="subscription-purchase">
                            <div  class='label'>Subscription and Save Purchase <span class='subscriptionPrice'></span></div></label>
                            </div>
                            <div class='additional-detail'>
                              <ul class='inner-detail'>
                                <li><span id='entry'></span> entry into every giveaway.</li>
                                <li>Secure your name into every giveaway.</li>
                                <li>Never miss your opportunity.</li>
                                <li>Cheapest and most affective way to win.</li>
                                <li>Change pause and cancel any time.</li>
                              </ul>
                            </div>
                    </div>
                </div>
            </div>
            `;

            let subscriptionBlock = document.getElementById(
              "subscription-app-block",
            );
            subscriptionBlock.innerHTML = mainWidget;
            let checkedOpn = document.getElementById("onetime-purchase");
            if (checkedOpn) {
              checkedOpn.checked = true;
            }
            
        const urlParams = new URLSearchParams(window.location.search);
        const variant = urlParams.get("variant");
        console.log(variant); 
        console.log("page location",window.location.href)
        if(variant){
          
          productJson?.variants?.map(item=>{
            if(item?.id==variant){
              selectedEntries= item?.option1.split(' ')[0]
            }
          })
              setCartProperties();
        }else{
          selectedEntries=  productJson?.variants[0]?.title?.split(' ')[0]
          console.log("variant not inurl and ebntries are==", selectedEntries)
          setCartProperties();
        }
           
          }
        };
        const updateEntries = () => {
          let span = document.getElementById('entry')
          if (span) {
            span.innerText = selectedEntries
          }
        }
        const handlePlanChange = (newPlan) => {
          if (newPlan) {
            // let hasActive = document.getElementsByClassName("active");
            // Array.from(hasActive).forEach((itm) => {
            //   itm.classList.remove("active");
            // });

            // let nowActive = document.getElementById(`${newPlan?.id}`);
            // if (nowActive) {
            //   nowActive.classList.add("active");
            // }
            selectedPlan = newPlan;
            selectedEntries = getEntries(selectedPlan?.description);
            // setTimeout(() => sendDataToCart(selectedPlan), 1000);

            sendDataToCart(selectedPlan);
            setPriceAndEntries(selectedPlan);
            updateEntries()
          } else {
            let hasActive = document.getElementsByClassName("active");
            Array.from(hasActive).forEach((itm) => {
              itm.classList.remove("active");
            });
            cartClear();
          }
        };
        const handleOnetimePlan = (variant) => {
          console.log("onetime-variant==", variant)
          selectedPlan = ''
          selectedEntries= variant
          cartClear();
          sendOnetimeDataToCart(variant)
        };
        const showWidget = () => {
          allSellingPlans?.map((item) => {
            let interval = item?.options[0]?.value?.split(" ")?.[0];
            if (interval == "day") {
              oneTimePlans?.push(item);
            } else {
              otherPlans?.push(item);
            }
          });
          console.log("oneTimePlans==", oneTimePlans);
          console.log("otherPlans==", otherPlans);
          oneTimePlans?.length > 0
            ? (selectedPlan = oneTimePlans[0])
            : (selectedPlan = otherPlans[0]);
          if (otherPlans?.length > 0 || oneTimePlans?.length > 0) {
            showVariantPlans();
          } else {
            let subscriptionBlock = dselectedPlanocument.getElementById(
              "subscription-app-block",
            );
            subscriptionBlock.innerHTML = "";
          }

          let quantityDiv = document.querySelectorAll(
            ".product-form__input.product-form__quantity",
          )[0];
          console.log("quantityDiv==", quantityDiv);
          if (quantityDiv) {
            quantityDiv.style.display = "none";
          }
        };
        // showWidget()

        /***code for product page timer */
        const showCountDown = () => {
          // const productImage = document.querySelectorAll('.product__media-wrapper')[0];
          const mediaGallery = document.querySelector("media-gallery");
          console.log("mediaGallery==", mediaGallery);
          // productImage.style.position = 'relative';

          const today = new Date(new Date().setHours(0, 0, 0, 0));
          const todayDate = today.getDate();
          const offerValidity = new Date(offerDuration?.end);
          const offerValidityDate = offerValidity.getDate();

          const main = document.createElement("div");
          main.className = "countdown-main-div";
          mediaGallery.appendChild(main);
          showWidget();
          function updateCountdown() {
            const now = new Date();
            const timeDifference = offerValidity - now;
            if (timeDifference > 0 || todayDate === offerValidityDate) {
              const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
              const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
              const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
              const seconds = Math.floor((timeDifference / 1000) % 60);

              // console.log("Today's countdown -- show time in hrs", hours, minutes, seconds);

              content = `<div class="countdown">
                        <div class='show-timer-div'>
                            <div class='time'>
                                <span>Days</span>
                                <span>${days}</span>
                            </div>
                            <span>:</span>
                           <div class='time'>
                                <span>Hrs</span>
                                <span>${hours}</span>
                            </div>
                            <span>:</span>
                           <div class='time'>
                                <span>Mins</span>
                               <span>${minutes}</span>
                            </div>
                            <span>:</span>
                           <div class='time'>
                              <span>Secs</span>
                              <span>${seconds}</span>
                            </div>
                       </div>
                    </div>`;
            } else if (todayDate > offerValidityDate || timeDifference <= 0) {
              let subscriptionBlock = document.getElementById(
                "subscription-app-block",
              );
              subscriptionBlock.innerHTML = "";
              content = `<div class="countdown">
                                        <p>OFFER EXPIRED</p>
                                    </div>`;
              clearInterval(timer);
            }
            main.innerHTML = content;
            // clearInterval(timer);
          }
          const timer = setInterval(updateCountdown, 1000);
          updateCountdown();
        };

        document.addEventListener("DOMContentLoaded", () => {
          const ticketRadios = document.querySelectorAll('input[type="radio"][name="Entries"]');
          console.log("ticketRadios===",ticketRadios); // Check if it's still empty
          ticketRadios.forEach(radio => {
            radio.addEventListener("click", () => {
              selectedEntries= radio?.value?.split(' ')[0]
              console.log(`Selected Entry: ${radio?.value}`, purchaseOption, selectedEntries);
              setCartProperties()
            });
          });
        });

        if (commanData?.raffleType == "time-limit") {
          // getOfferValidity();
          const date = commanData?.dateRange;
          const startIST = toIST(date.start);
          let endIST = toIST(date.end);
          endIST.setHours(23, 59, 59, 999);

          let dateRange = {
            start: startIST,
            end: endIST,
          };

          offerDuration = dateRange;
          console.log("offerDuration", offerDuration)
          const now = new Date();
          const timeDifferenceToStart = new Date(startIST) - now;
          console.log(
            dateRange,
            "timeDifferenceToStart==",
            timeDifferenceToStart,
          );
          if (timeDifferenceToStart < 0) {
            showCountDown();
          }
        } else {
          console.log("showWidget but inventory is==", inventory)

        }

       
      }
    }

}






























// console.log("js--__________=");

// // let serverPath = "https://dynadealersapp.com";
// let serverPath = "https://feof-pulse-watts-harbor.trycloudflare.com";
// let allProductId = [];
// let allOffers = [];
// let activeCurrency = Shopify?.currency?.active;
// let shop = Shopify.shop;
// let customerId = ShopifyAnalytics?.meta?.page?.customerId;
// let membershipDetails;
// let currentUrl = window.location.href;
// let purchaseOption = "subscription-purchase";
// let selectedEntries;
// let oneTimePrice = 0.0;
// let subscriptionPrice = 0.0;
// let allSellingPlans = [];
// let oneTimePlans = [];
// let otherPlans = [];
// let oneTimeSelectedPlan;
// let subscriptionSelectedPlan;
// let giveawayProduct = false;
// let inventory = 0;
// let showMemebershipLevels = false;
// let goldMembershipOffer = false;
// let offerDuration = {};
// let commanData;
// let options = [
//   { name: "Weekly", value: "week", class: "timePeriodList" },
//   { name: "Monthly", value: "month", class: "timePeriodList" },
//   { name: "Yearly", value: "year", class: "timePeriodList" },
// ];
// let selectedTimePlans = [];
// let selectedPlan;

// if (currentUrl.includes("account")) {
//   console.log("hello from account page");
//   let targetElement = document.querySelector(".customer__title");
//   if (targetElement) {
//     let cusDiv = document.createElement("div");
//     cusDiv.className = "mange-sub-container";
//     cusDiv.innerHTML = `<div class='subscription-manage'>
//                 <div>
//                 <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"  viewBox="0 0 24 24" fill="transparent">
//                   <path d="M16 17H21M18.5 14.5V19.5M12 19H6.2C5.0799 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2C3 7.0799 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H17.8C18.9201 5 19.4802 5 19.908 5.21799C20.2843 5.40973 20.5903 5.71569 20.782 6.09202C21 6.51984 21 7.0799 21 8.2V11M20.6067 8.26229L15.5499 11.6335C14.2669 12.4888 13.6254 12.9165 12.932 13.0827C12.3192 13.2295 11.6804 13.2295 11.0677 13.0827C10.3743 12.9165 9.73279 12.4888 8.44975 11.6335L3.14746 8.09863" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//                   </svg>
//                 </div>
//                 <h3>Manage Memberships</h3>
//                 </div>`;

//     cusDiv.addEventListener("click", function () {
//       const targetUrl = `https://${shop}/apps/subscription?cid=${customerId}`;
//       targetUrl ? (window.location.href = targetUrl) : "";
//     });
//     targetElement.parentNode.insertBefore(cusDiv, targetElement);
//     cusDiv.insertAdjacentHTML("afterend", "<br>");
//   }
// }

// if (subscription_page_type == "product") {
//   if (filtered_selling_plan_groups?.length > 0) {
//     filtered_selling_plan_groups?.forEach((item) => {
//       allSellingPlans?.push(...item?.selling_plans);
//     });
//     console.log("allSellingPlans==", allSellingPlans);
//   }
//   productJson?.selling_plan_groups?.map((itm) => {
//     let name = itm?.name?.toLowerCase();
//     name?.includes("level") ? (showMemebershipLevels = true) : "";
//     name?.includes("offer for gold membership")
//       ? (goldMembershipOffer = true)
//       : "";
//   });
//   function capitalize(str) {
//     return str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase();
//   }
//   const sendDataToCart = (plan) => {
//     console.log("plan in cart", plan);
//     var form = document.querySelectorAll('form[action*="/cart/add"]');
//     form.forEach((item) => {
//       var sellingPlanInputs = item.querySelectorAll(
//         'input[name="selling_plan"]',
//       );
//       if (sellingPlanInputs.length === 0) {
//         var newHiddenInput = document.createElement("input");
//         newHiddenInput.type = "hidden";
//         newHiddenInput.name = "selling_plan";
//         newHiddenInput.value = plan?.id;
//         item.appendChild(newHiddenInput);
//       } else {
//         sellingPlanInputs.forEach(function (input) {
//           input.value = plan?.id;
//         });
//       }
//     });
//   };
//   const cartClear = () => {
//     var form = document.querySelectorAll('form[action*="/cart/add"]');

//     form.forEach((item) => {
//       var sellingPlanInputs = item.querySelectorAll(
//         'input[name="selling_plan"]',
//       );

//       if (sellingPlanInputs.length > 0) {
//         sellingPlanInputs.forEach(function (input) {
//           input.value = "";
//         });
//       }
//     });
//   };
//   const toIST = (dateString) => {
//     const date = new Date(dateString);
//     const offsetInMinutes = 330;
//     return new Date(date.getTime() - offsetInMinutes * 60 * 1000);
//   };
//   const getEntries = (str) => {
//     let data = JSON.parse(str);
//     return data.entries;
//   };
//   const getCurrencySymbol = (currency) => {
//     const symbol = new Intl.NumberFormat("en", { style: "currency", currency })
//       .formatToParts()
//       .find((x) => x.type === "currency");
//     return symbol && symbol.value;
//   };
//   // let pName = productJson?.title.toUpperCase();
//   // console.log("pName", pName, pName?.includes("GOLD"));
//   // if (
//   //   pName?.includes("SILVER") ||
//   //   pName?.includes("GOLD") ||
//   //   pName?.includes("BRONZE") ||
//   //   pName?.includes("PLATINUM")
//   // ) {
//   //   giveawayProduct = true;
//   // }
//   // console.log("goldMembershipOffer==", goldMembershipOffer, customerId);
//   // if (goldMembershipOffer) {
//   //   if (customerId) {
//   //     const handlePlanType = (newPlan) => {
//   //       if (newPlan) {
//   //         let hasActive = document.getElementsByClassName("active");
//   //         Array.from(hasActive).forEach((itm) => {
//   //           itm.classList.remove("active");
//   //         });

//   //         let nowActive = document.getElementById(`${newPlan?.id}`);
//   //         if (nowActive) {
//   //           nowActive.classList.add("active");
//   //         }
//   //         selectedPlan = newPlan;
//   //         // selectedEntries = getEntries(selectedPlan?.description)
//   //         sendDataToCart(selectedPlan);
//   //         // setPriceAndEntries(selectedPlan)
//   //       }
//   //     };
//   //     const showPlan = () => {
//   //       let subscriptionBlock = document.getElementById(
//   //         "subscription-app-block",
//   //       );
//   //       console.log("subscriptionBlock==", subscriptionBlock);
//   //       content = `<div id="levels-box" class="oneTime-widget-box">
//   //                            <h4>Offer for ${capitalize(membershipDetails?.membershipLevel)} membership only</h4>
//   //                           <div class='plan-levels var-pill-wrapper' id='special-plan-levels'>

//   //                           </div>
//   //                   </div>`;
//   //       subscriptionBlock.innerHTML = content;

//   //       let entriesDiv = document.getElementById("special-plan-levels");
//   //       allSellingPlans?.map((item, index) => {
//   //         let planDiv = document.createElement("div");
//   //         planDiv.className =
//   //           item?.id == selectedPlan?.id ? `level-plan active` : `level-plan`;
//   //         planDiv.id = `${item?.id}`;
//   //         entriesDiv?.appendChild(planDiv);
//   //         let content = `
//   //         <label for="plan-${item?.id}" class="radio-wrapper-27">
//   //           <input type="radio" name="sub-option" id="plan-${item?.id}" ${item?.id === selectedPlan?.id ? "checked" : ""} />
//   //           <span class="var-entries">Get ${getEntries(item?.description)} Entries</span>
//   //           <span class="var-plan">${getCurrencySymbol(activeCurrency)}${parseFloat(item?.price_adjustments[0]?.value / 100)}
//   //           ${
//   //             item?.options[0]?.value?.split(" ")[0] == "day"
//   //               ? "onetime plan"
//   //               : item?.options[0]?.value?.split(" ")[0] == "month"
//   //                 ? "/mo"
//   //                 : ""
//   //           } only</span>
//   //           </label>`;
//   //         planDiv.innerHTML = content;
//   //         planDiv
//   //           .querySelector(`#plan-${item?.id}`)
//   //           .addEventListener("change", () => {
//   //             handlePlanType(item);
//   //           });
//   //       });
//   //     };
//   //     const getMembershipDetail = async () => {
//   //       try {
//   //         let data = {
//   //           shop: shop,
//   //           customerId: customerId,
//   //         };
//   //         const response = await fetch(`${serverPath}/api/getMembership`, {
//   //           method: "POST",
//   //           headers: {
//   //             "Content-Type": "application/json",
//   //           },
//   //           body: JSON.stringify(data),
//   //         });

//   //         const result = await response.json();
//   //         console.log("result==", result);
//   //         if (result.message == "success") {
//   //           membershipDetails = result?.data;

//   //           if (
//   //             membershipDetails.membershipLevel.toLowerCase() == "gold" &&
//   //             allSellingPlans
//   //           ) {
//   //             sendDataToCart(allSellingPlans[0]);
//   //             selectedPlan = allSellingPlans[0];
//   //             showPlan();
//   //           }
//   //         }
//   //       } catch (error) {
//   //         console.error("Error:", error);
//   //       }
//   //     };
//   //     console.log("goldMembershipOffer==", goldMembershipOffer);
//   //     getMembershipDetail();
//   //   }
//   // } else if (giveawayProduct) {
//   //   if (allSellingPlans?.length == 1) {
//   //     sendDataToCart(allSellingPlans[0]);
//   //   }
//   // } 
//   if (allSellingPlans?.length == 1) {
//     if (allSellingPlans) {
//       sendDataToCart(allSellingPlans[0]);
//     }
//   }else {
//       if (allSellingPlans?.length > 1) {
        
//         const ticketRadios = document.querySelectorAll('input[type="radio"][name="tickets"]');

// console.log("ticketRadios====", ticketRadios); // NodeList of radio inputs with name "tickets"

//         commanData = JSON.parse(allSellingPlans[0]?.description);
//         console.log("commanData==", commanData);

//         const setPriceAndEntries = (plan) => {
//           console.log("plan= setPriceAndEntries== cart===", plan);
//           let entries = getEntries(plan?.description);
//           selectedEntries = entries;
//           if (purchaseOption == "oneTime-purchase") {
//             oneTimeSelectedPlan = plan;
//             subscriptionSelectedPlan = otherPlans?.filter((itm) =>
//               itm?.name?.includes(`-entries-${entries}`),
//             )[0];
//           } else {
//             subscriptionSelectedPlan = plan;
//             oneTimeSelectedPlan = oneTimePlans?.filter((itm) =>
//               itm?.name?.includes(`-entries-${entries}`),
//             )[0];
//           }
//           oneTimePrice = oneTimeSelectedPlan?.price_adjustments[0]?.value / 100;
//           subscriptionPrice =
//             subscriptionSelectedPlan?.price_adjustments[0]?.value / 100;
//           let oneTimePriceDiv =
//             document.getElementsByClassName("oneTimePrice")[0];
//           let subscriptionPriceDiv =
//             document.getElementsByClassName("subscriptionPrice")[0];
//           oneTimePriceDiv.innerText = oneTimePrice
//             ? `${getCurrencySymbol(activeCurrency)}${oneTimePrice}`
//             : "";
//           subscriptionPriceDiv.innerText = subscriptionPrice
//             ? `${getCurrencySymbol(activeCurrency)}${subscriptionPrice}`
//             : "";

//           if (
//             (purchaseOption == "oneTime-purchase" && !oneTimePrice) ||
//             (purchaseOption == "subscription-purchase" && !subscriptionPrice)
//           ) {
//             handlePlanChange();
//           }
//         };
//         const setCartProperties = (flag = false) => {
//           let entriesDiv;
//           let plans = [];
//           if (purchaseOption == "oneTime-purchase") {
//             plans = oneTimePlans;
//           } else {
//             plans = otherPlans;
//           }
//           if (flag) {
//             oneTimeSelectedPlan = oneTimePlans?.filter((itm) =>
//               itm?.name?.includes(`-entries-${selectedEntries}`),
//             )[0];
//             subscriptionSelectedPlan = otherPlans?.filter((itm) =>
//               itm?.name?.includes(`-entries-${selectedEntries}`),
//             )[0];
//             if (purchaseOption == "oneTime-purchase") {
//               handlePlanChange(oneTimeSelectedPlan);
//             } else {
//               handlePlanChange(subscriptionSelectedPlan);
//             }
//           }
//           if (plans?.length > 0) {
//             entriesDiv = document.getElementById("entries-plans");
//             entriesDiv.innerHTML = "";
//             plans?.map((item) => {
//               let planDiv = document.createElement("div");
//               planDiv.className =
//                 item?.id == selectedPlan?.id
//                   ? "onetime-selling-plan active"
//                   : "onetime-selling-plan";
//               planDiv.id = `${item?.id}`;
//               entriesDiv?.appendChild(planDiv);
//               let content = `
//               <label for="plan-${item?.id}" class="radio-wrapper-27">
//                 <input type="radio" name="sub-option" id="plan-${item?.id}" ${item?.id === selectedPlan?.id ? "checked" : ""} />
//                 <span class="var-entries">${getEntries(item?.description)} Entries</span>
//                 </label>`;
//               planDiv.innerHTML = content;
//               planDiv
//                 .querySelector(`#plan-${item?.id}`)
//                 .addEventListener("change", () => {
//                   handlePlanChange(item);
//                 });
//             });
//           } else {
//             let parent = document.getElementById("oneTime");
//             if (parent) {
//               parent.remove();
//             }
//           }
//         };

//         function handlePurchaseType(event) {
//           purchaseOption = event.target.value;
//           let div = document.getElementsByClassName('additional-detail')[0]
//           console.log("div=====", div, event.target.value)
//           if (div) {
//             if (event.target.value == "oneTime-purchase") {
//               div.style.display = 'none';
//             } else {
//               div.style.display = 'block';
//             }
//           }
//           setCartProperties(true);
//         }
//         const showVariantPlans = () => {
//           if (
//             subscription_page_type == "product" &&
//             (otherPlans?.length > 0 || oneTimePlans?.length > 0)
//           ) {
//             let mainWidget = `<div id='show-inventory'>
                  
//                     </div>
//                     <div id="oneTime" class="oneTime purchase-optn-main">
//                 <div class="oneTime-body">
//                     <div id="oneTime-widget-box" class="oneTime-widget-box">
//                          <h5>Entries</h5>
//                         <div id="entries-plans" class="var-pill-wrapper">
//                         </div>
//                     </div>
//                 </div>
//                 <div class='other-options'>
//                 <h5>Purchase options</h5>
//                         <div id="options" class="options">
//                          <div class='onetime-purchase'>
//                             <input type="radio" id="onetime-purchase" value='oneTime-purchase' name="purchase-option" 
//               onchange='handlePurchaseType(event)'/>
//                             <label for="onetime-purchase">
//                             <div class='label'>One-time Purchase <span class='oneTimePrice'></span></div>
//                             </label>
//                         </div>
//                         <div class='subscription-purchase'>
//                             <input type="radio" id="subscription-purchase"  value='subscription-purchase' name="purchase-option"
//               onchange='handlePurchaseType(event)' />
//                             <label for="subscription-purchase">
//                             <div  class='label'>Subscription and Save Purchase <span class='subscriptionPrice'></span></div></label>
//                             </div>
//                             <div class='additional-detail'>
//                               <ul class='inner-detail'>
//                                 <li><span id='entry'></span> entry into every giveaway.</li>
//                                 <li>Secure your name into every giveaway.</li>
//                                 <li>Never miss your opportunity.</li>
//                                 <li>Cheapest and most affective way to win.</li>
//                                 <li>Change pause and cancel any time.</li>
//                               </ul>
//                             </div>
//                     </div>
//                 </div>
//             </div>
//             `;

//             let subscriptionBlock = document.getElementById(
//               "subscription-app-block",
//             );
//             subscriptionBlock.innerHTML = mainWidget;
//             let checkedOpn = document.getElementById("onetime-purchase");
//             if (checkedOpn) {
//               checkedOpn.checked = true;
//             }
//             setCartProperties();
//             sendDataToCart(selectedPlan);
//             setPriceAndEntries(selectedPlan);
//           }
//         };
//         const updateEntries = () => {
//           let span = document.getElementById('entry')
//           if (span) {
//             span.innerText = selectedEntries
//           }
//         }
//         const handlePlanChange = (newPlan) => {
//           if (newPlan) {
//             let hasActive = document.getElementsByClassName("active");
//             Array.from(hasActive).forEach((itm) => {
//               itm.classList.remove("active");
//             });

//             let nowActive = document.getElementById(`${newPlan?.id}`);
//             if (nowActive) {
//               nowActive.classList.add("active");
//             }
//             selectedPlan = newPlan;
//             selectedEntries = getEntries(selectedPlan?.description);
//             sendDataToCart(selectedPlan);
//             setPriceAndEntries(selectedPlan);
//             updateEntries()
//           } else {
//             let hasActive = document.getElementsByClassName("active");
//             Array.from(hasActive).forEach((itm) => {
//               itm.classList.remove("active");
//             });
//             cartClear();
//           }
//         };
//         const showWidget = () => {
//           allSellingPlans?.map((item) => {
//             let interval = item?.options[0]?.value?.split(" ")?.[0];
//             if (interval == "day") {
//               oneTimePlans?.push(item);
//             } else {
//               otherPlans?.push(item);
//             }
//           });
//           console.log("oneTimePlans==", oneTimePlans);
//           console.log("otherPlans==", otherPlans);
//           oneTimePlans?.length > 0
//             ? (selectedPlan = oneTimePlans[0])
//             : (selectedPlan = otherPlans[0]);
//           if (otherPlans?.length > 0 || oneTimePlans?.length > 0) {
//             showVariantPlans();
//           } else {
//             let subscriptionBlock = document.getElementById(
//               "subscription-app-block",
//             );
//             subscriptionBlock.innerHTML = "";
//           }

//           let quantityDiv = document.querySelectorAll(
//             ".product-form__input.product-form__quantity",
//           )[0];
//           console.log("quantityDiv==", quantityDiv);
//           if (quantityDiv) {
//             quantityDiv.style.display = "none";
//           }
//         };
//         // showWidget()

//         /***code for product page timer */
//         const showCountDown = () => {
//           // const productImage = document.querySelectorAll('.product__media-wrapper')[0];
//           const mediaGallery = document.querySelector("media-gallery");
//           console.log("mediaGallery==", mediaGallery);
//           // productImage.style.position = 'relative';

//           const today = new Date(new Date().setHours(0, 0, 0, 0));
//           const todayDate = today.getDate();
//           const offerValidity = new Date(offerDuration?.end);
//           const offerValidityDate = offerValidity.getDate();

//           const main = document.createElement("div");
//           main.className = "countdown-main-div";
//           mediaGallery.appendChild(main);
//           showWidget();
//           function updateCountdown() {
//             const now = new Date();
//             const timeDifference = offerValidity - now;
//             if (timeDifference > 0 || todayDate === offerValidityDate) {
//               const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
//               const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
//               const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
//               const seconds = Math.floor((timeDifference / 1000) % 60);

//               // console.log("Today's countdown -- show time in hrs", hours, minutes, seconds);

//               content = `<div class="countdown">
//                         <div class='show-timer-div'>
//                             <div class='time'>
//                                 <span>Days</span>
//                                 <span>${days}</span>
//                             </div>
//                             <span>:</span>
//                            <div class='time'>
//                                 <span>Hrs</span>
//                                 <span>${hours}</span>
//                             </div>
//                             <span>:</span>
//                            <div class='time'>
//                                 <span>Mins</span>
//                                <span>${minutes}</span>
//                             </div>
//                             <span>:</span>
//                            <div class='time'>
//                               <span>Secs</span>
//                               <span>${seconds}</span>
//                             </div>
//                        </div>
//                     </div>`;
//             } else if (todayDate > offerValidityDate || timeDifference <= 0) {
//               let subscriptionBlock = document.getElementById(
//                 "subscription-app-block",
//               );
//               subscriptionBlock.innerHTML = "";
//               content = `<div class="countdown">
//                                         <p>OFFER EXPIRED</p>
//                                     </div>`;
//               clearInterval(timer);
//             }
//             main.innerHTML = content;
//             // clearInterval(timer);
//           }
//           const timer = setInterval(updateCountdown, 1000);
//           updateCountdown();
//         };
//         // const getOfferValidity = async () => {
//         //   try {
//         //     let data = {
//         //       productId: productJson.id,
//         //     };
//         //     const response = await fetch(
//         //       `${serverPath}/api/getProductOfferValidity`,
//         //       {
//         //         method: "POST",
//         //         headers: {
//         //           "Content-Type": "application/json",
//         //         },
//         //         body: JSON.stringify(data),
//         //       },
//         //     );

//         //     const result = await response.json();
//         //     if (result.message == "success") {
//         //       const date = result?.offerValidity
//         //       const startIST = new Date(date.start); // Convert to Date object
//         //       let endIST = new Date(date.end); // Convert to Date object
//         //       endIST.setHours(23, 59, 59, 999); // Ensure the end time is at the end of the day

//         //       let dateRange = {
//         //           start: startIST,
//         //           end: endIST,
//         //       };

//         //       offerDuration = dateRange;
//         //       const now = new Date();
//         //       const timeDifferenceToStart = new Date(startIST) - now;
//         //       console.log(dateRange, "timeDifferenceToStart==", timeDifferenceToStart)
//         //       if (timeDifferenceToStart < 0) {
//         //           showCountDown();
//         //       }
//         //     }
//         //   } catch (error) {
//         //     console.error("Error:", error);
//         //   }
//         // };

//         if (commanData?.raffleType == "time-limit") {
//           // getOfferValidity();
//           const date = commanData?.dateRange;
//           const startIST = toIST(date.start);
//           let endIST = toIST(date.end);
//           endIST.setHours(23, 59, 59, 999);

//           let dateRange = {
//             start: startIST,
//             end: endIST,
//           };

//           offerDuration = dateRange;
//           console.log("offerDuration", offerDuration)
//           const now = new Date();
//           const timeDifferenceToStart = new Date(startIST) - now;
//           console.log(
//             dateRange,
//             "timeDifferenceToStart==",
//             timeDifferenceToStart,
//           );
//           if (timeDifferenceToStart < 0) {
//             showCountDown();
//           }
//         } else {
//           console.log("showWidget but inventory is==", inventory)

//         }

//         /***code for product page timer */

//         const showInventory = () => {
//           let inventoryDiv = document.getElementById("show-inventory");
//           let span = document.createElement("span");
//           span.id = "product-inventory";
//           console.log("inventoryDiv==", inventoryDiv);
//           span.innerText = `${inventory} left`;
//           inventoryDiv?.appendChild(span);
//         };
//         // const getProductDetails = async () => {
//         //   try {
//         //     let data = {
//         //       productId: productJson?.id,
//         //       shop: shop,
//         //     };
//         //     const response = await fetch(`${serverPath}/api/productDetails`, {
//         //       method: "POST",
//         //       headers: {
//         //         "Content-Type": "application/json",
//         //       },
//         //       body: JSON.stringify(data),
//         //     });

//         //     const result = await response.json();
//         //     console.log("result==", result);
//         //     if (result.message == "success") {
//         //       inventory = result.data.product.totalInventory;
//         //       console.log("inventory==", inventory);
//         //       // showInventory();
//         //       // inventory > 0 ? showWidget() : "";
//         //     }
//         //   } catch (error) {
//         //     console.error("Error:", error);
//         //   }
//         // };
//         // getProductDetails();
//       }
//     }
//     // console.log(
//     //   customerId,
//     //   "ShopifyAnalytics==",
//     //   ShopifyAnalytics,
//     //   ShopifyAnalytics?.meta?.page?.customerId,
//     // );

// }
