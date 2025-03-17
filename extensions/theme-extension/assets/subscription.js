console.log("js--__________=");

// let serverPath = "https://dynadealersapp.com";
let serverPath = "https://warriors-trainers-phoenix-und.trycloudflare.com";
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
let offerDuration={};
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
  const sendDataToCart = (plan) => {
    console.log("plan in cart", plan);
    var form = document.querySelectorAll('form[action*="/cart/add"]');
    form.forEach((item) => {
      var sellingPlanInputs = item.querySelectorAll(
        'input[name="selling_plan"]',
      );
      if (sellingPlanInputs.length === 0) {
        var newHiddenInput = document.createElement("input");
        newHiddenInput.type = "hidden";
        newHiddenInput.name = "selling_plan";
        newHiddenInput.value = plan?.id;
        item.appendChild(newHiddenInput);
      } else {
        sellingPlanInputs.forEach(function (input) {
          input.value = plan?.id;
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
          input.value = "";
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
  // let pName = productJson?.title.toUpperCase();
  // console.log("pName", pName, pName?.includes("GOLD"));
  // if (
  //   pName?.includes("SILVER") ||
  //   pName?.includes("GOLD") ||
  //   pName?.includes("BRONZE") ||
  //   pName?.includes("PLATINUM")
  // ) {
  //   giveawayProduct = true;
  // }
  // console.log("goldMembershipOffer==", goldMembershipOffer, customerId);
  // if (goldMembershipOffer) {
  //   if (customerId) {
  //     const handlePlanType = (newPlan) => {
  //       if (newPlan) {
  //         let hasActive = document.getElementsByClassName("active");
  //         Array.from(hasActive).forEach((itm) => {
  //           itm.classList.remove("active");
  //         });

  //         let nowActive = document.getElementById(`${newPlan?.id}`);
  //         if (nowActive) {
  //           nowActive.classList.add("active");
  //         }
  //         selectedPlan = newPlan;
  //         // selectedEntries = getEntries(selectedPlan?.description)
  //         sendDataToCart(selectedPlan);
  //         // setPriceAndEntries(selectedPlan)
  //       }
  //     };
  //     const showPlan = () => {
  //       let subscriptionBlock = document.getElementById(
  //         "subscription-app-block",
  //       );
  //       console.log("subscriptionBlock==", subscriptionBlock);
  //       content = `<div id="levels-box" class="oneTime-widget-box">
  //                            <h4>Offer for ${capitalize(membershipDetails?.membershipLevel)} membership only</h4>
  //                           <div class='plan-levels var-pill-wrapper' id='special-plan-levels'>
    
  //                           </div>
  //                   </div>`;
  //       subscriptionBlock.innerHTML = content;

  //       let entriesDiv = document.getElementById("special-plan-levels");
  //       allSellingPlans?.map((item, index) => {
  //         let planDiv = document.createElement("div");
  //         planDiv.className =
  //           item?.id == selectedPlan?.id ? `level-plan active` : `level-plan`;
  //         planDiv.id = `${item?.id}`;
  //         entriesDiv?.appendChild(planDiv);
  //         let content = `
  //         <label for="plan-${item?.id}" class="radio-wrapper-27">
  //           <input type="radio" name="sub-option" id="plan-${item?.id}" ${item?.id === selectedPlan?.id ? "checked" : ""} />
  //           <span class="var-entries">Get ${getEntries(item?.description)} Entries</span>
  //           <span class="var-plan">${getCurrencySymbol(activeCurrency)}${parseFloat(item?.price_adjustments[0]?.value / 100)}
  //           ${
  //             item?.options[0]?.value?.split(" ")[0] == "day"
  //               ? "onetime plan"
  //               : item?.options[0]?.value?.split(" ")[0] == "month"
  //                 ? "/mo"
  //                 : ""
  //           } only</span>
  //           </label>`;
  //         planDiv.innerHTML = content;
  //         planDiv
  //           .querySelector(`#plan-${item?.id}`)
  //           .addEventListener("change", () => {
  //             handlePlanType(item);
  //           });
  //       });
  //     };
  //     const getMembershipDetail = async () => {
  //       try {
  //         let data = {
  //           shop: shop,
  //           customerId: customerId,
  //         };
  //         const response = await fetch(`${serverPath}/api/getMembership`, {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify(data),
  //         });

  //         const result = await response.json();
  //         console.log("result==", result);
  //         if (result.message == "success") {
  //           membershipDetails = result?.data;

  //           if (
  //             membershipDetails.membershipLevel.toLowerCase() == "gold" &&
  //             allSellingPlans
  //           ) {
  //             sendDataToCart(allSellingPlans[0]);
  //             selectedPlan = allSellingPlans[0];
  //             showPlan();
  //           }
  //         }
  //       } catch (error) {
  //         console.error("Error:", error);
  //       }
  //     };
  //     console.log("goldMembershipOffer==", goldMembershipOffer);
  //     getMembershipDetail();
  //   }
  // } else if (giveawayProduct) {
  //   if (allSellingPlans?.length == 1) {
  //     sendDataToCart(allSellingPlans[0]);
  //   }
  // } 
   if (allSellingPlans?.length == 1) {
    if (allSellingPlans) {
      sendDataToCart(allSellingPlans[0]);
    }
  } 
  // else if (showMemebershipLevels) {
  //   selectedPlan = allSellingPlans[0];
  //   sendDataToCart(selectedPlan);
  //   const handlePlanLevel = (newPlan) => {
  //     if (newPlan) {
  //       let hasActive = document.getElementsByClassName("active");
  //       Array.from(hasActive).forEach((itm) => {
  //         itm.classList.remove("active");
  //       });

  //       let nowActive = document.getElementById(`${newPlan?.id}`);
  //       if (nowActive) {
  //         nowActive.classList.add("active");
  //       }
  //       selectedPlan = newPlan;
  //       // selectedEntries = getEntries(selectedPlan?.description)
  //       sendDataToCart(selectedPlan);
  //       // setPriceAndEntries(selectedPlan)
  //     }

  //     // else {
  //     //     let hasActive = document.getElementsByClassName('active');
  //     //     Array.from(hasActive).forEach(itm => {
  //     //         itm.classList.remove('active');
  //     //     });
  //     //     cartClear()
  //     // }
  //   };
  //   const showLevels = () => {
  //     let entriesDiv = document.getElementById("plan-levels");
  //     allSellingPlans?.map((item, index) => {
  //       let planDiv = document.createElement("div");
  //       planDiv.className =
  //         item?.id == selectedPlan?.id ? `level-plan active` : `level-plan`;
  //       planDiv.id = `${item?.id}`;
  //       entriesDiv?.appendChild(planDiv);
  //       let content = `
  //         <label for="plan-${item?.id}" class="radio-wrapper-27">
  //           <input type="radio" name="sub-option" id="plan-${item?.id}" ${item?.id === selectedPlan?.id ? "checked" : ""} />
  //           <span class="var-plan">${capitalize(item?.name.split("-")[0])}</span>
  //           <span class="var-entries">${getEntries(item?.description)} Entries</span>
  //           </label>`;
  //       planDiv.innerHTML = content;
  //       planDiv
  //         .querySelector(`#plan-${item?.id}`)
  //         .addEventListener("change", () => {
  //           handlePlanLevel(item);
  //         });
  //     });
  //   };
  //   let subscriptionBlock = document.getElementById("subscription-app-block");
  //   console.log("subscriptionBlock==", subscriptionBlock);
  //   content = `<div id="levels-box" class="oneTime-widget-box">
  //                        <h4>Membership level</h4>
  //                       <div class='plan-levels var-pill-wrapper' id='plan-levels'>

  //                       </div>
  //               </div>`;
  //   subscriptionBlock.innerHTML = content;
  //   showLevels();
  // } 
  else {
    if (allSellingPlans?.length > 1 ) {
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

        if (
          (purchaseOption == "oneTime-purchase" && !oneTimePrice) ||
          (purchaseOption == "subscription-purchase" && !subscriptionPrice)
        ) {
          handlePlanChange();
        }
      };
      const generatePlans = (flag = false) => {
        let entriesDiv;
        let plans = [];
        if (purchaseOption == "oneTime-purchase") {
          plans = oneTimePlans;
        } else {
          plans = otherPlans;
        }
        if (flag) {
          oneTimeSelectedPlan = oneTimePlans?.filter((itm) =>
            itm?.name?.includes(`-entries-${selectedEntries}`),
          )[0];
          subscriptionSelectedPlan = otherPlans?.filter((itm) =>
            itm?.name?.includes(`-entries-${selectedEntries}`),
          )[0];
          if (purchaseOption == "oneTime-purchase") {
            handlePlanChange(oneTimeSelectedPlan);
          } else {
            handlePlanChange(subscriptionSelectedPlan);
          }
        }
        if (plans?.length > 0) {
          entriesDiv = document.getElementById("entries-plans");
          entriesDiv.innerHTML = "";
          plans?.map((item) => {
            let planDiv = document.createElement("div");
            planDiv.className =
              item?.id == selectedPlan?.id
                ? "onetime-selling-plan active"
                : "onetime-selling-plan";
            planDiv.id = `${item?.id}`;
            entriesDiv?.appendChild(planDiv);
            let content = `
              <label for="plan-${item?.id}" class="radio-wrapper-27">
                <input type="radio" name="sub-option" id="plan-${item?.id}" ${item?.id === selectedPlan?.id ? "checked" : ""} />
                <span class="var-entries">${getEntries(item?.description)} Entries</span>
                </label>`;
            planDiv.innerHTML = content;
            planDiv
              .querySelector(`#plan-${item?.id}`)
              .addEventListener("change", () => {
                handlePlanChange(item);
              });
          });
        } else {
          let parent = document.getElementById("oneTime");
          if (parent) {
            parent.remove();
          }
        }
      };

      function handlePurchaseType(event) {
        purchaseOption = event.target.value;
        let div= document.getElementsByClassName('additional-detail')[0]
        console.log("div=====", div, event.target.value)
       if(div){
        if(event.target.value=="oneTime-purchase"){
          div.style.display='none';
        }else{
          div.style.display='block';
        }
       }
        generatePlans(true);
      }
      const showVariantPlans = () => {
        if (
          subscription_page_type == "product" &&
          (otherPlans?.length > 0 || oneTimePlans?.length > 0)
        ) {
          let mainWidget = `<div id='show-inventory'>
                  
                    </div>
                    <div id="oneTime" class="oneTime purchase-optn-main">
                <div class="oneTime-body">
                    <div id="oneTime-widget-box" class="oneTime-widget-box">
                         <h5>Entries</h5>
                        <div id="entries-plans" class="var-pill-wrapper">
                        </div>
                    </div>
                </div>
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
          generatePlans();
          sendDataToCart(selectedPlan);
          setPriceAndEntries(selectedPlan);
        }
      };
      const updateEntries=()=>{
        let span= document.getElementById('entry')
        if(span){
          span.innerText= selectedEntries
        }
      }
      const handlePlanChange = (newPlan) => {
        if (newPlan) {
          let hasActive = document.getElementsByClassName("active");
          Array.from(hasActive).forEach((itm) => {
            itm.classList.remove("active");
          });

          let nowActive = document.getElementById(`${newPlan?.id}`);
          if (nowActive) {
            nowActive.classList.add("active");
          }
          selectedPlan = newPlan;
          selectedEntries = getEntries(selectedPlan?.description);
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
          let subscriptionBlock = document.getElementById(
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
      const getOfferValidity = async () => {
        try {
          let data = {
            productId: productJson.id,
          };
          const response = await fetch(
            `${serverPath}/api/getProductOfferValidity`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            },
          );

          const result = await response.json();
          if (result.message == "success") {
            const date = result?.offerValidity
            const startIST = new Date(date.start); // Convert to Date object
            let endIST = new Date(date.end); // Convert to Date object
            endIST.setHours(23, 59, 59, 999); // Ensure the end time is at the end of the day
        
            let dateRange = {
                start: startIST,
                end: endIST,
            };
        
            offerDuration = dateRange;
            const now = new Date();
            const timeDifferenceToStart = new Date(startIST) - now;
            console.log(dateRange, "timeDifferenceToStart==", timeDifferenceToStart)
            if (timeDifferenceToStart < 0) {
                showCountDown();
            }
          }
        } catch (error) {
          console.error("Error:", error);
        }
      };
      
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

      /***code for product page timer */

      const showInventory = () => {
        let inventoryDiv = document.getElementById("show-inventory");
        let span = document.createElement("span");
        span.id = "product-inventory";
        console.log("inventoryDiv==", inventoryDiv);
        span.innerText = `${inventory} left`;
        inventoryDiv?.appendChild(span);
      };
      const getProductDetails = async () => {
        try {
          let data = {
            productId: productJson?.id,
            shop: shop,
          };
          const response = await fetch(`${serverPath}/api/productDetails`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });

          const result = await response.json();
          console.log("result==", result);
          if (result.message == "success") {
            inventory = result.data.product.totalInventory;
            console.log("inventory==", inventory);
            // showInventory();
            // inventory > 0 ? showWidget() : "";
          }
        } catch (error) {
          console.error("Error:", error);
        }
      };
      getProductDetails();
    }
  }
  console.log(
    customerId,
    "ShopifyAnalytics==",
    ShopifyAnalytics,
    ShopifyAnalytics?.meta?.page?.customerId,
  );
}





















// const codeForTimer = () => {
//     let cards = document.querySelectorAll('.card-wrapper.product-card-wrapper');
//     let cardss = document.getElementsByClassName('card-wrapper');
//     console.log("cards==", cards, cardss)
//     cards?.forEach(card => {
//         let productId = card.getAttribute('data-product-id');
//         console.log("Product ID:", productId);
//         allProductId.push(productId)
//     })
//     const getListOfOfferValidity = async () => {
//         try {
//             let data = {
//                 allProductId: allProductId
//             }
//             const response = await fetch(
//                 `${serverPath}/api/getProductOfferValidity`,
//                 {
//                     method: "POST",
//                     headers: {
//                         "Content-Type": "application/json",
//                     },
//                     body: JSON.stringify(data),
//                 }
//             );

//             const result = await response.json();
//             if (result.message == "success") {
//                 console.log("result.data==", result.data)
//                 result.data?.map((itm) => {

//                     const date = itm?.offerValidity
//                     const startIST = toIST(date?.start);
//                     let endIST = toIST(date?.end);
//                     endIST.setHours(23, 59, 59, 999);

//                     let dateRange = {
//                         start: startIST,
//                         end: endIST,
//                     };
//                     allOffers.push({
//                         ...itm,
//                         offerValidity: dateRange
//                     })
//                 })
//                 console.log("allOffers=", allOffers)
//                 checkOfferOnProducts()
//             }
//         } catch (error) {
//             console.error("Error:", error);
//         }
//     }
//     getListOfOfferValidity()

//     const checkOfferOnProducts = () => {
//         cards.forEach(card => {
//             console.log(card);
//             let productId = card.getAttribute('data-product-id');
//             console.log("Product ID:", productId);
//             allOffers?.map(offer => {
//                 if (offer?.id == productId) {
//                     const now = new Date();
//                     const timeDifferenceToStart = new Date(offer?.offerValidity?.start) - now;
//                     console.log("timeDifferenceToStart==", timeDifferenceToStart)
//                     if (timeDifferenceToStart < 0) {
//                         console.log("offer?.id=", productId, offer?.id)
//                         let cardInner = card.getElementsByClassName('card__inner color-background-2 gradient ratio')[0]
//                         console.log(cardInner)
//                         const main = document.createElement('div');
//                         main.className = 'list-countdown-main-div';
//                         let content = ''
//                         cardInner.insertAdjacentElement('afterend', main);

//                         const today = new Date(new Date().setHours(0, 0, 0, 0));
//                         const todayDate = today.getDate();
//                         const offerValidity = new Date(offer?.offerValidity?.end)
//                         const offerValidityDate = offerValidity.getDate();
//                         function updateCountdown() {
//                             const now = new Date();
//                             const timeDifference = offerValidity - now;
//                             console.log("timeDifference== for mini counter", timeDifference)
//                             if (timeDifference > 0 || todayDate === offerValidityDate) {
//                                 const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24))
//                                 const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
//                                 const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
//                                 const seconds = Math.floor((timeDifference / 1000) % 60);

//                                 // console.log("Today's countdown -- show time in hrs", days, hours, minutes, seconds);

//                                 content = `<div class="countdown">
//                         <div class='show-timer-div'>
//                          <div class='time'>
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
//                             } else if (todayDate > offerValidityDate || timeDifference <= 0) {
//                                 content = `<div class="countdown">
//                                         <p>GIVEAWAY ENDED</p>
//                                     </div>`;
//                                 clearInterval(timer);
//                             }
//                             main.innerHTML = content;
//                         }
//                         const timer = setInterval(updateCountdown, 1000);
//                         updateCountdown();
//                     }
//                 }
//             })
//         });
//     }
// }
// codeForTimer()


// console.log("js---=")
// document.addEventListener("DOMContentLoaded", () => {
//     let indexPage = document.getElementById('index')
//     let collectionPage = document.getElementById('collection')
//     console.log("subscription_page_type------------------", indexPage)
//     let serverPath = "https://rental-todd-of-promises.trycloudflare.com";
//     let allProductId = []
//     let allOffers = []
//     let activeCurrency = Shopify?.currency?.active;
//     let shop = Shopify.shop;
//     let currentUrl = window.location.href;
//     let purchaseOption = "oneTime-purchase"
//     let allSellingPlans = []
//     let oneTimePlans = []
//     let otherPlans = []
//     let giveawayProduct = false
//     let options = [
//         { name: "Weekly", value: "week", class: "timePeriodList" },
//         { name: "Monthly", value: "month", class: "timePeriodList" },
//         { name: "Yearly", value: "year", class: "timePeriodList" }
//     ]
//     let offerDuartion = {}
//     let selectedTimePlans = []
//     let selectedPlan;
//     const codeForTimer = () => {
//         let cards = document.querySelectorAll('.card-wrapper.product-card-wrapper');
//         let cardss = document.getElementsByClassName('card-wrapper');
//         console.log("cards==", cards, cardss)
//         cards?.forEach(card => {
//             let productId = card.getAttribute('data-product-id');
//             console.log("Product ID:", productId);
//             allProductId.push(productId)
//         })
//         const getListOfOfferValidity = async () => {
//             try {
//                 let data = {
//                     allProductId: allProductId
//                 }
//                 const response = await fetch(
//                     `${serverPath}/api/getProductOfferValidity`,
//                     {
//                         method: "POST",
//                         headers: {
//                             "Content-Type": "application/json",
//                         },
//                         body: JSON.stringify(data),
//                     }
//                 );

//                 const result = await response.json();
//                 if (result.message == "success") {
//                     console.log("result.data==", result.data)
//                     result.data?.map((itm) => {

//                         const date = itm?.offerValidity
//                         const startIST = toIST(date?.start);
//                         let endIST = toIST(date?.end);
//                         endIST.setHours(23, 59, 59, 999);

//                         let dateRange = {
//                             start: startIST,
//                             end: endIST,
//                         };
//                         allOffers.push({
//                             ...itm,
//                             offerValidity: dateRange
//                         })
//                     })
//                     console.log("allOffers=", allOffers)
//                     checkOfferOnProducts()
//                 }
//             } catch (error) {
//                 console.error("Error:", error);
//             }
//         }
//         getListOfOfferValidity()

//         const checkOfferOnProducts = () => {
//             cards.forEach(card => {
//                 console.log(card);
//                 let productId = card.getAttribute('data-product-id');
//                 console.log("Product ID:", productId);
//                 allOffers?.map(offer => {
//                     if (offer?.id == productId) {
//                         const now = new Date();
//                         const timeDifferenceToStart = new Date(offer?.offerValidity?.start) - now;
//                         console.log("timeDifferenceToStart==", timeDifferenceToStart)
//                         if (timeDifferenceToStart < 0) {
//                             console.log("offer?.id=", productId, offer?.id)
//                             let cardInner = card.getElementsByClassName('card__inner color-background-2 gradient ratio')[0]
//                             console.log(cardInner)
//                             const main = document.createElement('div');
//                             main.className = 'list-countdown-main-div';
//                             let content = ''
//                             cardInner.insertAdjacentElement('afterend', main);

//                             const today = new Date(new Date().setHours(0, 0, 0, 0));
//                             const todayDate = today.getDate();
//                             const offerValidity = new Date(offer?.offerValidity?.end)
//                             const offerValidityDate = offerValidity.getDate();
//                             function updateCountdown() {
//                                 const now = new Date();
//                                 const timeDifference = offerValidity - now;
//                                 console.log("timeDifference== for mini counter", timeDifference)
//                                 if (timeDifference > 0 || todayDate === offerValidityDate) {
//                                     const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24))
//                                     const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
//                                     const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
//                                     const seconds = Math.floor((timeDifference / 1000) % 60);

//                                     // console.log("Today's countdown -- show time in hrs", days, hours, minutes, seconds);

//                                     content = `<div class="countdown">
//                             <div class='show-timer-div'>
//                              <div class='time'>
//                                     <span>Days</span>
//                                     <span>${days}</span>
//                                 </div>
//                                 <span>:</span>
//                                <div class='time'>
//                                     <span>Hrs</span>
//                                     <span>${hours}</span>
//                                 </div>
//                                 <span>:</span>
//                                <div class='time'>
//                                     <span>Mins</span>
//                                    <span>${minutes}</span>
//                                 </div>
//                                 <span>:</span>
//                                <div class='time'>
//                                   <span>Secs</span>
//                                   <span>${seconds}</span>
//                                 </div>
//                            </div>
//                         </div>`;
//                                 } else if (todayDate > offerValidityDate || timeDifference <= 0) {
//                                     content = `<div class="countdown">
//                                             <p>GIVEAWAY ENDED</p>
//                                         </div>`;
//                                     clearInterval(timer);
//                                 }
//                                 main.innerHTML = content;
//                             }
//                             const timer = setInterval(updateCountdown, 1000);
//                             updateCountdown();
//                         }
//                     }
//                 })
//             });
//         }
//     }
//     // if (indexPage || collectionPage) {
//     // codeForTimer()
//     // }

//     // if (currentUrl.includes("account")) {
//     //     console.log("hello from account page")
//     //     // let targetElement = document.getElementsByClassName("order-container")[0];
//     //     let targetElement = document.querySelector(".customer__title");
//     //     console.log("targetElement=", targetElement)
//     //     if (targetElement) {
//     //         let cusDiv = document.createElement("div");
//     //         cusDiv.className = "mange-sub-container"
//     //         let linebreak = document.createElement("br");
//     //         cusDiv.innerHTML = `<div class='subscription-manage'>
//     //             <div>
//     //             <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"  viewBox="0 0 24 24" fill="transparent">
//     //               <path d="M16 17H21M18.5 14.5V19.5M12 19H6.2C5.0799 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2C3 7.0799 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H17.8C18.9201 5 19.4802 5 19.908 5.21799C20.2843 5.40973 20.5903 5.71569 20.782 6.09202C21 6.51984 21 7.0799 21 8.2V11M20.6067 8.26229L15.5499 11.6335C14.2669 12.4888 13.6254 12.9165 12.932 13.0827C12.3192 13.2295 11.6804 13.2295 11.0677 13.0827C10.3743 12.9165 9.73279 12.4888 8.44975 11.6335L3.14746 8.09863" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//     //               </svg>
//     //             </div>
//     //             <h3>Manage Memberships</h3>
//     //             </div>`;

//     //         const id = ShopifyAnalytics.meta.page.customerId;
//     //         cusDiv.addEventListener("click", function () {
//     //             const targetUrl = `https://${shop}/apps/subscription?cid=${id}`;
//     //             targetUrl ? window.location.href = targetUrl : "";
//     //         });
//     //         targetElement.parentNode.insertBefore(cusDiv, targetElement);
//     //         cusDiv.insertAdjacentHTML("afterend", "<br>");
//     //     }
//     // }

//     if (subscription_page_type == "product") {
//         const sendDataToCart = (plan) => {
//             var form = document.querySelectorAll('form[action*="/cart/add"]');
//             form.forEach((item) => {
//                 var sellingPlanInputs = item.querySelectorAll(
//                     'input[name="selling_plan"]'
//                 );
//                 if (sellingPlanInputs.length === 0) {
//                     var newHiddenInput = document.createElement("input");
//                     newHiddenInput.type = "hidden";
//                     newHiddenInput.name = "selling_plan";
//                     newHiddenInput.value = plan?.id;
//                     item.appendChild(newHiddenInput);
//                 } else {
//                     sellingPlanInputs.forEach(function (input) {
//                         input.value = plan?.id;
//                     });
//                 }
//             });
//         }
//         let pName=productJson?.title.toUpperCase()
//         if (pName.includes('SILVER') || pName.includes('GOlD') || pName.includes('BRONZE') || pName.includes('PLATINUM')) {
//             giveawayProduct = true
//         }
//         if (filtered_selling_plan_groups?.length > 0) {
//             filtered_selling_plan_groups?.forEach((item) => {
//                 allSellingPlans?.push(...item?.selling_plans)
//             })
//             console.log("allSellingPlans==", allSellingPlans)
//         }
//         if (giveawayProduct) {
//             if (allSellingPlans) {
//                 sendDataToCart(allSellingPlans[0])
//             }
//         } else {
//             const toIST = (dateString) => {
//                 const date = new Date(dateString);
//                 const offsetInMinutes = 330;
//                 return new Date(date.getTime() - offsetInMinutes * 60 * 1000);
//             };
//             // if (subscription_page_type && subscription_page_type == "product") {

//             if (allSellingPlans?.length > 1) {
//                 // filtered_selling_plan_groups?.forEach((item) => {
//                 //     allSellingPlans?.push(...item?.selling_plans)
//                 // })
//                 allSellingPlans?.map(item => {
//                     let interval = item?.options[0]?.value?.split(' ')?.[0]
//                     if (interval == 'day') {
//                         oneTimePlans?.push(item)
//                     } else {
//                         otherPlans?.push(item)
//                     }
//                 })

//                 oneTimePlans?.length > 0 ? selectedPlan = oneTimePlans[0] : selectedPlan = otherPlans[0]
//                 /***code for timmer */

//                 /***code for subscription plans */

//                 const sendDataToCart = (plan) => {
//                     var form = document.querySelectorAll('form[action*="/cart/add"]');
//                     form.forEach((item) => {
//                         var sellingPlanInputs = item.querySelectorAll(
//                             'input[name="selling_plan"]'
//                         );
//                         if (sellingPlanInputs.length === 0) {
//                             var newHiddenInput = document.createElement("input");
//                             newHiddenInput.type = "hidden";
//                             newHiddenInput.name = "selling_plan";
//                             newHiddenInput.value = plan?.id;
//                             item.appendChild(newHiddenInput);
//                         } else {
//                             sellingPlanInputs.forEach(function (input) {
//                                 input.value = plan?.id;
//                             });
//                         }
//                     });
//                 }
//                 const getCurrencySymbol = (currency) => {
//                     const symbol = new Intl.NumberFormat("en", { style: "currency", currency })
//                         .formatToParts()
//                         .find((x) => x.type === "currency");
//                     return symbol && symbol.value;
//                 };
//                 const getEntries = (str) => {
//                     let data = JSON.parse(str);
//                     return data.entries;
//                 }
//                 const createDiv = (selectedTimePlans, flag = false) => {
//                     console.log("selectedTimePlans==createDiv", selectedTimePlans)
//                     const otherPlansDiv = document.getElementById('subscription-plans')
//                     otherPlansDiv.innerHTML = ''
//                     selectedTimePlans?.map((item, index) => {
//                         let planDiv = document.createElement('div');
//                         planDiv.className = (item?.id == selectedPlan?.id) ? "subscription-selling-plan active" : `subscription-selling-plan`;
//                         let cls = index == 0 ? "first-plan" : index == 1 ? "second-plan" : index == 2 ? "third-plan" : '';
//                         planDiv.classList.add(cls);
//                         planDiv.id = `${item?.id}`;
//                         otherPlansDiv?.appendChild(planDiv)
//                         let content = `
//            <label for="plan-${item?.id}">
//            <div class="plan-radio">
//             <div class="radio-wrapper-27">
//               <input type="radio" name="sub-option" id="plan-${item?.id}" ${item?.id === selectedPlan?.id ? 'checked' : ''} />
//                 <span class="var-price">${getCurrencySymbol(activeCurrency)}${(item?.price_adjustments[0]?.value) / 100}<sub id="purchase-type">/${item.options[0].value.split(' ')[0]}</sub></span>
//             </div>
//             <span class="var-entries mobile-entries">${getEntries(item?.description)} Entries</span>
//             ${((item?.price_adjustments[0]?.value) / 100) >= 50 ? `<p class="gradiant-text-value">Biggest Value!</p>`
//                                 : ((item?.price_adjustments[0]?.value) / 100) >= 25 ? `<p class="gradiant-text-value">Most Popular!</p>` : ``}
//             </div>
//          </label>`
//                         planDiv.innerHTML = content;
//                         planDiv.querySelector(`#plan-${item?.id}`).addEventListener('change', () => handlePlanChange(item));
//                     })
//                     if (flag) {
//                         if (selectedTimePlans?.length > 0) {
//                             handlePlanChange(selectedTimePlans[0])
//                         } else {
//                             oneTimePlans?.length > 0 ?
//                                 handlePlanChange(oneTimePlans[0]) : cartClear()
//                         }
//                     }
//                 }
//                 const generatePlans = (time) => {
//                     let oneTimePlansDiv;
//                     if (oneTimePlans?.length > 0) {
//                         oneTimePlansDiv = document.getElementById('entries-plans')
//                         oneTimePlansDiv.innerHTML = ''
//                         oneTimePlans?.map((item) => {
//                             let planDiv = document.createElement('div');
//                             planDiv.className = (item?.id == selectedPlan?.id) ? "onetime-selling-plan active" : "onetime-selling-plan";
//                             planDiv.id = `${item?.id}`;
//                             oneTimePlansDiv?.appendChild(planDiv)
//                             let content = `
//               <label for="plan-${item?.id}" class="radio-wrapper-27">
//                 <input type="radio" name="sub-option" id="plan-${item?.id}" ${item?.id === selectedPlan?.id ? 'checked' : ''} />
//                 <span class="var-entries">${getEntries(item?.description)} Entries</span>
//                 </label>`
//                 // <span class="var-price">
//                 //     <span class='currancy-symbol'>${getCurrencySymbol(activeCurrency)}</span>
//                 //     <span class='dollar-rate'>${(item?.price_adjustments[0]?.value) / 100}</span>
//                 // </span>
//                             planDiv.innerHTML = content;
//                             planDiv.querySelector(`#plan-${item?.id}`).addEventListener('change', () => {
//                                 handlePlanChange(item)
//                             });
//                         })
//                     } else {
//                         let parent = document.getElementById('oneTime');
//                         if (parent) {
//                             parent.remove();
//                         }
//                     }

//                     if (otherPlans?.length > 0) {
//                         const selectedTimePlans = otherPlans?.filter((item) => item.options[0].value.split(' ')[0] == time)
//                         if (selectedTimePlans) {
//                             createDiv(selectedTimePlans)
//                         }
//                     } else {
//                         let parent = document.getElementById('subscription');
//                         if (parent) {
//                             parent.remove();
//                         }
//                     }
//                 }
//                 const showVariantPlans = () => {
//                     if (subscription_page_type == "product" && (otherPlans?.length > 0 || oneTimePlans?.length > 0)) {
//                         let mainWidget = `<div id="oneTime" class="oneTime purchase-optn-main">
//                 <div class="oneTime-body">
//                     <div id="oneTime-widget-box" class="oneTime-widget-box">
//                          <h5>Entries</h5>
//                         <div id="entries-plans" class="var-pill-wrapper">
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
//                         <h3>Subscribe for More Chances to Win Every Month!</h3>
//                         <p>Get bonus entries every plan and join draws. More entries mean more chances to win multiple prizes, all for less than buying individual entries.</p>
//                         <select id="timePeriod" name="timePeriod" class='selectTime'>
//                         </select>
//                         <div id="subscription-plans">
//                         </div>
//                 </div>
//             </div>
//         </div>`

//                         let subscriptionBlock = document.getElementById('subscription-app-block')
//                         subscriptionBlock.innerHTML = mainWidget;
//                         let selectElement = document.getElementById("timePeriod")
//                         let optionContent = ''
//                         options.map(option => {
//                             const opt = document.createElement('option');
//                             opt.value = option.value;
//                             opt.textContent = option.name;
//                             opt.className = option.class;

//                             // Append the <option> element to the <select> element
//                             selectElement.appendChild(opt);

//                         })

//                         selectElement.addEventListener("change", (e) => {
//                             selectedTimePlans = otherPlans?.filter((item) => item.options[0].value.split(' ')[0] == e.target.value)
//                             createDiv(selectedTimePlans, true);
//                         });
//                         generatePlans(options[0]?.value);
//                     }
//                 }
//                 const cartClear = () => {
//                     var form = document.querySelectorAll('form[action*="/cart/add"]');

//                     form.forEach((item) => {
//                         var sellingPlanInputs = item.querySelectorAll(
//                             'input[name="selling_plan"]'
//                         );

//                         if (sellingPlanInputs.length > 0) {
//                             sellingPlanInputs.forEach(function (input) {
//                                 input.value = "";
//                             });
//                         }
//                     })
//                 }
//                 const handlePlanChange = (newPlan) => {
//                     let hasActive = document.getElementsByClassName('active');
//                     Array.from(hasActive).forEach(itm => {
//                         itm.classList.remove('active');
//                     });

//                     let nowActive = document.getElementById(`${newPlan?.id}`);
//                     if (nowActive) {
//                         nowActive.classList.add('active');
//                     }
//                     // let checkOnetime = newPlan?.options[0]?.value?.split(' ')[0] == 'day'
//                     selectedPlan = newPlan
//                     sendDataToCart(selectedPlan)
//                 }
//                 sendDataToCart(selectedPlan)
//                 const setOptions = () => {
//                     let week = 0;
//                     let month = 0;
//                     let year = 0;
//                     otherPlans?.map(plan => {
//                         let type = plan?.options[0]?.value.split(' ')[0]
//                         if (type == 'week') {
//                             week = week + 1
//                         } else if (type == "month") {
//                             month = month + 1
//                         } else if (type == "year") {
//                             year = year + 1
//                         }
//                     })
//                     if (week == 0) {
//                         options = options.filter(option => option.value !== "week");
//                     }
//                     if (month == 0) {
//                         options = options.filter(option => option.value !== "month");
//                     }
//                     if (year == 0) {
//                         options = options.filter(option => option.value !== "year");
//                     }
//                 }
//                 const showWidget = () => {
//                     if (otherPlans?.length > 0 || oneTimePlans?.length > 0) {
//                         console.log('oyherplans==', otherPlans)
//                         setOptions()
//                         showVariantPlans();
//                     } else {
//                         let subscriptionBlock = document.getElementById('subscription-app-block')
//                         subscriptionBlock.innerHTML = '';
//                     }
//                 }
//                 // showWidget()

//             }
//         }
//     }
// })
