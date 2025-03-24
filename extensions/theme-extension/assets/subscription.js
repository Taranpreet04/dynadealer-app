console.log("js--________");

let serverPath = "https://dynadealersapp.com";
// let serverPath = "https://gsm-floating-fear-activated.trycloudflare.com";
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
let oneTimeMembership = false
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
    // console.log("allSellingPlans==", allSellingPlans);
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
    let productForms = document.querySelectorAll('form[action="/cart/add"]');

    productForms.forEach((form) => {
      if (!form) return;

      // Check if the 'entries' input already exists, else create and append it
      let entriesInput = form.querySelector('input[name="properties[entries]"]');
      if (!entriesInput) {
        entriesInput = document.createElement("input");
        entriesInput.type = "hidden";
        entriesInput.name = "properties[entries]";
        form.appendChild(entriesInput);
      }
      entriesInput.value = entry;

      // Check if the 'plan-type' input already exists, else create and append it
      let typeInput = form.querySelector('input[name="properties[plan-type]"]');
      if (!typeInput) {
        typeInput = document.createElement("input");
        typeInput.type = "hidden";
        typeInput.name = "properties[plan-type]";
        form.appendChild(typeInput);
      }
      typeInput.value = "onetime";

      if (oneTimeMembership) {
        let memInput = form.querySelector('input[name="properties[membership]"]');
        if (!memInput) {
          memInput = document.createElement("input");
          memInput.type = "hidden";
          memInput.name = "properties[membership]";
          form.appendChild(memInput);
        }
        memInput.value = productJson?.type;
      }
    });
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


  const sendPlanDataToCart = (plan) => {
    if (!plan || !plan.id) {
      console.warn("Invalid plan data provided");
      return;
    }

    // Select all forms with /cart/add action
    var forms = document.querySelectorAll('form[action*="/cart/add"]');

    if (forms.length === 0) {
      console.warn("No cart/add forms found on the page.");
      return;
    }

    forms.forEach((form) => {
      if (!form) return;

      // Select existing selling plan inputs
      var sellingPlanInputs = form.querySelectorAll('input[name="selling_plan"]');

      if (sellingPlanInputs.length === 0) {

        var newHiddenInput = document.createElement("input");
        newHiddenInput.type = "hidden";
        newHiddenInput.name = "selling_plan";
        newHiddenInput.value = plan.id;
        form.appendChild(newHiddenInput);
      } else {

        sellingPlanInputs.forEach((input) => {
          if (input) {
            input.value = plan.id;
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
  const setPriceAndEntries = (plan) => {
    // let entries = getEntries(plan?.description);
    // selectedEntries = entries;
    // if (purchaseOption == "oneTime-purchase") {
    //   oneTimeSelectedPlan = plan;
    //   subscriptionSelectedPlan = otherPlans?.filter((itm) =>
    //     itm?.name?.includes(`-entries-${entries}`),
    //   )[0];
    // } else {
    //   subscriptionSelectedPlan = plan;
    //   oneTimeSelectedPlan = oneTimePlans?.filter((itm) =>
    //     itm?.name?.includes(`-entries-${entries}`),
    //   )[0];
    // }
    // oneTimePrice = oneTimeSelectedPlan?.price_adjustments[0]?.value / 100;
    subscriptionPrice =
      plan?.price_adjustments[0]?.value / 100;
    // let oneTimePriceDiv =
    //   document.getElementsByClassName("oneTimePrice")[0];
    let subscriptionPriceDiv = document.getElementsByClassName("subscriptionPrice");
    console.log("subscriptionPriceDiv==", subscriptionPriceDiv);

    // Convert HTMLCollection to an array and loop over it
    Array.from(subscriptionPriceDiv).forEach((div) => {
      div.innerText = subscriptionPrice
        ? `${getCurrencySymbol(activeCurrency)}${subscriptionPrice}`
        : "";
    });


  };
  const handleOnetimePlan = (variant) => {
    selectedPlan = ''
    cartClear();
    selectedEntries = variant
    sendOnetimeDataToCart(variant)
    let plan = otherPlans?.filter((itm) =>
      itm?.name?.includes(`-entries-${selectedEntries}`),
    )[0];
    setPriceAndEntries(plan)
  };

  if (allSellingPlans?.length == 1) {
    if (allSellingPlans) {
      purchaseOption = "subscription-purchase"
      sendPlanDataToCart(allSellingPlans[0]);
    }
  } else if (productJson?.variants?.length === 1) {
    let variant = productJson?.variants[0]?.title.split(' ')[0]
    if (Number(variant) > 0) {
      oneTimeMembership = true
      purchaseOption = "oneTime-purchase"
      handleOnetimePlan(variant)
    }
  } else {
    if (allSellingPlans?.length > 1) {

      commanData = JSON.parse(allSellingPlans[0]?.description);


      const setCartProperties = () => {
        subscriptionSelectedPlan = otherPlans?.filter((itm) =>
          itm?.name?.includes(`-entries-${selectedEntries}`),
        )[0];
        // console.log("In Cart properties change")
        // console.log("subscriptionSelectedPlan==", subscriptionSelectedPlan)
        // console.log("purchaseOption==", purchaseOption)
        // console.log("selectedEntries==", selectedEntries)
        if (purchaseOption == "oneTime-purchase") {
          handleOnetimePlan(selectedEntries)
        } else {
          if (subscriptionSelectedPlan) {
            handlePlanChange(subscriptionSelectedPlan);
          }
        }
      };

      function handlePurchaseType(event) {
        purchaseOption = event.target.value;

        let div = document.getElementsByClassName('additional-detail')[0]
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
                              <div class="delivery-freq">
                              <h5>Dilevery Frequency</h5>
                              <div class="delivery-freq-inner">
                              <p>Every 1 month</p>
                              <span class='subscriptionPrice'></span></div>
                              </div>
                              </div>
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
          if (variant) {
            productJson?.variants?.map(item => {
              if (item?.id == variant) {
                selectedEntries = item?.option1.split(' ')[0]
              }
            })

            setCartProperties();
          } else {
            selectedEntries = productJson?.variants[0]?.title?.split(' ')[0]
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
          selectedPlan = newPlan;
          selectedEntries = getEntries(selectedPlan?.description);
          // setTimeout(() => sendPlanDataToCart(selectedPlan), 1000);

          sendPlanDataToCart(selectedPlan);
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
        if (quantityDiv) {
          quantityDiv.style.display = "none";
        }
      };
      // showWidget()

      /***code for product page timer */
      const showCountDown = () => {
        // const productImage = document.querySelectorAll('.product__media-wrapper')[0];
        const mediaGallery = document.querySelector("media-gallery");
        // productImage.style.position = 'relative';

        const today = new Date(new Date().setHours(0, 0, 0, 0));
        const todayDate = today.getDate();
        const offerValidity = new Date(offerDuration?.end);
        const offerValidityDate = offerValidity.getDate();

        const main = document.createElement("div");
        main.className = "countdown-main-div";
        // mediaGallery.appendChild(main); //hide counter
        showWidget();

        function updateCountdown() {
          const now = new Date();
          const timeDifference = offerValidity - now;
          if (timeDifference > 0 || todayDate === offerValidityDate) {
            const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
            const seconds = Math.floor((timeDifference / 1000) % 60);


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
        ticketRadios.forEach(radio => {
          radio.addEventListener("click", () => {
            selectedEntries = radio?.value?.split(' ')[0]
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
        const now = new Date();
        const timeDifferenceToStart = new Date(startIST) - now;

        if (timeDifferenceToStart < 0) {
          showCountDown();
        }
      } else {
        console.log("no counter")
      }
    }
  }

}
