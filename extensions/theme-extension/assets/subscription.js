//live

// const sweatShirt='46962651922646'
// const tshirt='46962641109206'
// const hat='46962642845910'
// let serverPath = "https://dynadealersapp.com";
// const data = [
//     {
//       name: 'Silver',
//       variants: [
//         { id: '46952891252950', also_added: hat } // silver main product
//       ]
//     },
//     {
//       name: 'Gold',
//       variants: [
//         { id: '46952894202070', also_added: hat },
//         { id: '46952894202070', also_added: tshirt } // same main product, different gifts
//       ]
//     },
//     {
//       name: 'Platinum',
//       variants: [
//         { id: '46952896299222', also_added: hat },
//         { id: '46952896299222', also_added: tshirt },
//         { id: '46952896299222', also_added: sweatShirt }
//       ]
//     }
//   ];

// // local

const hat = "42830762999910";
const tshirt = "42830791082086";
const sweatShirt = "42830884700262";
let serverPath = "https://has-convicted-the-cameron.trycloudflare.com";
// console.log("serverPath");
const page = subscription_page_type;
// console.log(page, "page_type");
const data = [
  {
    name: "Silver",
    variants: [
      { id: "42813523394662", also_added: hat }, // silver main product
    ],
  },
  {
    name: "Gold",
    variants: [
      { id: "42813523427430", also_added: hat },
      { id: "42813523427430", also_added: tshirt }, // same main product, different gifts
    ],
  },
  {
    name: "Platinum",
    variants: [
      { id: "42813523460198", also_added: hat },
      { id: "42813523460198", also_added: tshirt },
      { id: "42813523460198", also_added: sweatShirt },
    ],
  },
];
//
// console.log("js--________", window.location.pathname);
const locationPath = window.location.pathname;
let multiplier = 1;
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
let oneTimeMembership = false;
let modalData = [];

let options = [
  { name: "Weekly", value: "week", class: "timePeriodList" },
  { name: "Monthly", value: "month", class: "timePeriodList" },
  { name: "Yearly", value: "year", class: "timePeriodList" },
];
let selectedTimePlans = [];
let selectedPlan;

const silverYearlyGift = [hat];
const goldYearlyGift = [hat, tshirt];
const platinumYearlyGift = [hat, tshirt, sweatShirt];
let freeProductList = [];

const getcartItems = async () => {
  fetch("/cart.js")
    .then((res) => res.json())
    .then((cart) => {
      let items = [];
      list?.forEach((gift) => {
        items?.push({
          id: gift,
          quantity: 1,
          properties: {
            // _free: true
          },
        });
      });
      // const alreadyInCart = cart.items.some(item => item.variant_id === gift);
      // if (!alreadyInCart) {
      fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items }),
      })
        .then((res) => res.json())
        .then((data) => {
          // console.log("Free product added:", data);
        })
        .catch((err) => console.error("Error adding free product:", err));
      // }
    });
};
async function getMultiplierData(productId) {
  // console.log(productId, "productId------");

  try {
    const res = await fetch(`${serverPath}/getDataOnStorefront?shop=${shop}`, {
      method: "GET",
    });

    const data = await res.json();

    if (res?.status === 200 && data) {
      const config = data;

      const isManualEnabled =
        config.isManualEnabled === "true" || config.isManualEnabled === true;
      const isAllEnabled =
        config.isAllEnabled === "true" || config.isAllEnabled === true;

      // If manual mode ON → check only the given product
      if (isManualEnabled && Array.isArray(config.products)) {
        const product = config.products.find(
          (p) =>
            p.product_id === productId ||
            p.product_id === `gid://shopify/Product/${productId}`,
        );

        if (product && product.multiplier) {
          multiplier = parseFloat(product.multiplier) || 1;
        } else {
          // Product not found → return 1 immediately
          return 1;
        }
      }
      // If manual OFF but all products multiplier is enabled
      else if (isAllEnabled && config.allProductMultiplier) {
        multiplier = parseFloat(config.allProductMultiplier) || 1;
      }
    }

    return multiplier;
  } catch (err) {
    console.error("Error fetching multiplier data:", err);
    return 1;
  }
}
function addBonusMultiplierBadge(multiplierValue) {
  const entriesInputs = document.getElementsByName("Entries");
  if (!entriesInputs.length) return;

  Array.from(entriesInputs).forEach((entriesInput) => {
    const parent = entriesInput.parentElement;
    const label = parent.querySelector("label");

    // Get the base entry count
    let baseEntries = null;

    // Method 1: From label text (case-insensitive)
    if (label && label.textContent) {
      const match = label.textContent.match(/(\d+)\s*Entr(y|ies)/i);
      if (match) {
        baseEntries = parseInt(match[1], 10);
      }
    }

    // Method 2: From data attribute
    if (baseEntries == null && entriesInput.dataset.entries) {
      baseEntries = parseInt(entriesInput.dataset.entries, 10);
    }

    // Method 3: From value string
    if (baseEntries == null && entriesInput.value) {
      const matchValue = entriesInput.value.match(/(\d+)/);
      if (matchValue) {
        baseEntries = parseInt(matchValue[1], 10);
      }
    }

    // Fallback to 1
    if (baseEntries == null) baseEntries = 1;

    // Calculate multiplied value
    let finalEntries = baseEntries;
    if (
      multiplierValue &&
      !isNaN(multiplierValue) &&
      parseFloat(multiplierValue) > 1
    ) {
      finalEntries = baseEntries * parseFloat(multiplierValue);
    }

    // Remove existing badge
    const oldBadge = parent.querySelector(".bonus-badge");
    if (oldBadge) oldBadge.remove();

    // Style label
    if (label) {
      label.classList.add("bonus-badge-label");
      label.style.display = "inline-block";
      label.style.padding = "0";
      label.style.border = "none";
      label.style.background = "transparent";
      label.style.overflow = "visible";
    }

    // Create badge
    const badge = document.createElement("div");
    badge.className = "bonus-badge";
    badge.style.display = "inline-flex";
    badge.style.alignItems = "center";
    badge.style.borderRadius = "50px";
    badge.style.overflow = "hidden";
    badge.style.fontWeight = "bold";
    badge.style.fontSize = "16px";

    // Left side
    const leftDiv = document.createElement("div");
    leftDiv.className = "bonus-badge-left";
    leftDiv.innerText = `${finalEntries} ENTRIES`;
    leftDiv.style.background = "#000";
    leftDiv.style.color = "#fff";
    leftDiv.style.padding = "15px 22px";
    leftDiv.style.borderTopRightRadius = "50px";
    leftDiv.style.borderBottomRightRadius = "50px";
    leftDiv.style.position = "relative";
    leftDiv.style.zIndex = "2";

    // Right side (multiplier)
    if (multiplierValue && parseFloat(multiplierValue) > 1) {
      const rightDiv = document.createElement("div");
      rightDiv.className = "bonus-badge-right";
      rightDiv.innerText = `${multiplierValue}X`;
      rightDiv.style.background = "red";
      rightDiv.style.color = "#fff";
      rightDiv.style.padding = "14px 32px";
      rightDiv.style.fontStyle = "italic";
      rightDiv.style.textShadow = "0 0 5px rgba(255,255,255,0.8)";
      rightDiv.style.position = "relative";
      rightDiv.style.left = "0";
      rightDiv.style.zIndex = "1";
      rightDiv.style.marginLeft = "-25px";
      rightDiv.style.borderRadius = "0px 50px 50px 0px";

      badge.appendChild(leftDiv);
      badge.appendChild(rightDiv);
    } else {
      leftDiv.style.borderRadius = "50px";
      badge.appendChild(leftDiv);
    }

    // Replace label content with badge
    if (label) {
      label.innerHTML = "";
      label.appendChild(badge);
    }
  });
}

async function getProductData(productId) {
  try {
    const res = await fetch(
      `${serverPath}/api/getProductEntries?shop=${shop}&productId=${productId}`,
      {
        method: "GET",
        // credentials: "include",
      },
    );
    const data = await res.json();
    // console.log("Multiplier data fetched:", data);
    // console.log(data, "response00------");

    return data;
  } catch (err) {
    console.error("Error fetching multiplier data:", err);
    return 1;
  }
}

// Run the function with your desired multiplier

if (locationPath === "/cart") {
  (function () {
    let refreshTriggered = false;

    // Replace this with your actual mapping

    function deepEqual(obj1, obj2) {
      return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    function buildExpectedCartState(cartItems) {
      const cartVariantIds = cartItems.map((item) =>
        item.variant_id.toString(),
      );
      let expected = {};
      let alsoAddedMap = {};
      let oneTimeNeeded = false;

      data.forEach((product) => {
        product.variants.forEach((variant) => {
          const isMainInCart = cartVariantIds.includes(variant.id);
          const alsoAddedId = variant.also_added;

          if (isMainInCart) {
            oneTimeNeeded = true;
            expected[alsoAddedId] = (expected[alsoAddedId] || 0) + 1;
            alsoAddedMap[alsoAddedId] = true;
          } else {
            if (!alsoAddedMap[alsoAddedId]) {
              expected[alsoAddedId] = 0;
            }
          }
        });
      });

      // expected[one_time_activation_variant] = oneTimeNeeded ? 1 : 0;

      return expected;
    }

    function getCurrentRelevantItems(cartItems) {
      const allAlsoAdded = data.flatMap((p) =>
        p.variants.map((v) => v.also_added),
      );
      const allTracked = [...allAlsoAdded];
      // , one_time_activation_variant];
      let current = {};

      cartItems.forEach((item) => {
        const id = item.variant_id.toString();
        if (allTracked.includes(id)) {
          current[id] = item.quantity;
        }
      });

      return current;
    }

    function updateCartQuantities(expected, currentState) {
      let hasRealChange = false;
      const formData = new FormData();

      Object.entries(expected).forEach(([id, qty]) => {
        const currentQty = currentState[id] || 0;
        if (qty !== currentQty) {
          formData.append(`updates[${id}]`, qty);
          hasRealChange = true;
        }
      });

      if (!hasRealChange) return;

      fetch("/cart/update.js", { method: "POST", body: formData })
        .then((res) => res.json())
        .then(() => fetch("/cart.json"))
        .then((res) => res.json())
        .then((updatedCart) => {
          const verified = getCurrentRelevantItems(updatedCart.items);
          const rebuiltExpected = buildExpectedCartState(updatedCart.items);

          if (deepEqual(rebuiltExpected, verified)) {
            if (!refreshTriggered) {
              refreshTriggered = true;
              setTimeout(() => location.reload(), 1000);
            }
          } else {
            updateCartQuantities(rebuiltExpected, verified);
          }
        })
        .catch((err) => console.error("❌ Failed to update cart", err));
    }

    function removeUnlinkedGifts(cartItems) {
      const allAlsoAdded = data.flatMap((p) =>
        p.variants.map((v) => v.also_added),
      );
      const mainIds = data.flatMap((p) => p.variants.map((v) => v.id));

      const cartVariantIds = cartItems.map((item) =>
        item.variant_id.toString(),
      );
      const unlinkedGiftIds = [];

      allAlsoAdded.forEach((giftId) => {
        const relatedMainExists = data.some((group) =>
          group.variants.some(
            (variant) =>
              cartVariantIds.includes(variant.id) &&
              variant.also_added === giftId,
          ),
        );

        const giftInCart = cartVariantIds.includes(giftId);
        if (giftInCart && !relatedMainExists) {
          unlinkedGiftIds.push(giftId);
        }
      });

      if (unlinkedGiftIds.length === 0) return;

      const formData = new FormData();
      unlinkedGiftIds.forEach((id) => {
        formData.append(`updates[${id}]`, 0);
      });

      fetch("/cart/update.js", { method: "POST", body: formData })
        .then((res) => res.json())
        .then((data) => {
          // console.log("🧹 Removed unlinked gifts:", unlinkedGiftIds);
          location.reload();
        })
        .catch((err) =>
          console.error("❌ Failed to remove unlinked gifts", err),
        );
    }

    function checkCartAndUpdate() {
      fetch("/cart.json")
        .then((res) => res.json())
        .then((cart) => {
          const current = getCurrentRelevantItems(cart.items);
          const expected = buildExpectedCartState(cart.items);

          if (!deepEqual(current, expected)) {
            updateCartQuantities(expected, current);
          }

          // 🧼 Remove unlinked gifts
          removeUnlinkedGifts(cart.items);
        })
        .catch((err) => console.error("❌ Failed to fetch cart", err));
    }

    function startCartWatcher() {
      checkCartAndUpdate();
      setInterval(checkCartAndUpdate, 2000);
    }

    // 🚀 Init
    startCartWatcher();
  })();
}

if (currentUrl.includes("account")) {
  let targetElement = document.querySelector(".customer__title");
  if (targetElement) {
    let cusDiv = document.createElement("div");
    cusDiv.className = "mange-sub-container";
    cusDiv.innerHTML = `<div class='subscription-manage'>
                <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"  viewBox="0 0 24 24" fill="transparent">
                  <path d="M16 17H21M18.5 14.5V19.5M12 19H6.2C5.0799 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2C3 7.0799 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H17.8C18.9201 5 19.4802 5 19.908 5.21799C20.2843 5.40973 20.5903 5.71569 20.782 6.09202C21 6.51984 21 7.0799 21 8.2V11M20.6067 8.26229L15.5499 11.6335C14.2669 12.4888 13.6254 12.9165 12.932 13.0827C12.3192 13.2295 11.6804 13.2295 11.0677 13.0827C10.3743 12.9165 9.73279 12.4888 8.44975 11.6335L3.14746 8.09863" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
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
document.getElementsByTagName("product-subscriptions")[0]?.remove();
if (
  subscription_page_type == "product" ||
  subscription_page_type == "index" ||
  subscription_page_type == "collection" ||
  subscription_page_type == "page"
) {
  const multiplierData = getMultiplierData(productJson?.id);
  // console.log(multiplierData, "multiplierdataaaaaa");

  if (multiplier > 1) {
    addBonusMultiplierBadge(multiplier);
  }

  function capitalize(str) {
    return str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase();
  }

  const sendOnetimeDataToCart = (entry) => {
    let productForms = document.querySelectorAll('form[action="/cart/add"]');
    let totalEntries = parseFloat(entry) * parseFloat(multiplier);

    productForms.forEach((form) => {
      if (!form) return;
      // Check if the 'entries' input already exists, else create and append it
      let entriesInput = form.querySelector(
        'input[name="properties[entries]"]',
      );
      if (!entriesInput) {
        entriesInput = document.createElement("input");
        entriesInput.type = "hidden";
        entriesInput.name = "properties[entries]";
        form.appendChild(entriesInput);
      }
      entriesInput.value = totalEntries;

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
        let memInput = form.querySelector(
          'input[name="properties[membership]"]',
        );
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
      const entriesInput = form.querySelector(
        'input[name="properties[entries]"]',
      );
      if (entriesInput) {
        entriesInput.remove();
      }

      // Check if 'plan-type' input exists and remove it
      const typeInput = form.querySelector(
        'input[name="properties[plan-type]"]',
      );
      if (typeInput) {
        typeInput.remove();
      }
    });
  };

  function addFreeProduct(list) {
    fetch("/cart.js")
      .then((res) => res.json())
      .then((cart) => {
        let items = [];
        list?.forEach((gift) => {
          items?.push({
            id: gift,
            quantity: 1,
            properties: {
              // _free: true
            },
          });
        });
        // const alreadyInCart = cart.items.some(item => item.variant_id === gift);
        // if (!alreadyInCart) {
        fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: items }),
        })
          .then((res) => res.json())
          .then((data) => {
            // console.log("Free product added:", data);
          })
          .catch((err) => console.error("Error adding free product:", err));
        // }
      });
  }

  // Hook onto any cart add button (adapt this to your theme)
  document.querySelectorAll('form[action*="/cart/add"]').forEach((form) => {
    form.addEventListener("submit", () => {
      setTimeout(addFreeProduct(freeProductList), 1000); // Delay to ensure first product is added
    });
  });

  const checkFreeProduct = (plan) => {
    let planName = plan?.name?.toLowerCase();
    let cycle = plan?.options[0]?.value.split(" ")[0];
    if (planName?.includes("silver") && cycle == "year") {
      // console.log("silverYearlyGift==", silverYearlyGift);
      freeProductList = silverYearlyGift;
    } else if (planName?.includes("gold") && cycle == "year") {
      // console.log("goldYearlyGift==", goldYearlyGift);
      freeProductList = goldYearlyGift;
    } else if (planName?.includes("platinum") && cycle == "year") {
      // console.log("platinumYearlyGift==", platinumYearlyGift);
      freeProductList = platinumYearlyGift;
    }
  };

  const sendPlanDataToCart = (plan) => {
    // console.log("sendPlanDataToCart==", plan);
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
      var sellingPlanInputs = form.querySelectorAll(
        'input[name="selling_plan"]',
      );

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

    checkFreeProduct(plan);
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
          input.remove();
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
    const symbol = new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    })
      .formatToParts()
      .find((x) => x.type === "currency");
    return symbol && symbol.value;
  };

  const setPriceAndEntries = (plan) => {
    subscriptionPrice = plan?.price_adjustments[0]?.value / 100;
    let subscriptionPriceDiv =
      document.getElementsByClassName("subscriptionPrice");

    // Convert HTMLCollection to an array and loop over it
    Array.from(subscriptionPriceDiv).forEach((div) => {
      div.innerText = subscriptionPrice
        ? `${getCurrencySymbol(activeCurrency)}${subscriptionPrice}`
        : "";
    });
  };

  const handleOnetimePlan = (variant) => {
    selectedPlan = "";
    cartClear();
    sendOnetimeDataToCart(variant);
    selectedEntries = variant;
    let plan = otherPlans?.filter((itm) =>
      itm?.name?.includes(`-entries-${selectedEntries}`),
    )[0];
    if (plan) {
      setPriceAndEntries(plan);
    }
  };

  // Define setCartProperties before using it
  const setCartProperties = () => {
    subscriptionSelectedPlan = otherPlans?.filter((itm) =>
      itm?.name?.includes(`-entries-${selectedEntries}`),
    )[0];
    if (purchaseOption == "oneTime-purchase") {
      handleOnetimePlan(selectedEntries);
    } else {
      if (subscriptionSelectedPlan) {
        handlePlanChange(subscriptionSelectedPlan);
      }
    }
  };

  // FIXED: Define handlePurchaseType as a global function
  window.handlePurchaseType = function (event) {
    purchaseOption = event.target.value;

    let div = document.getElementsByClassName("additional-detail")[0];
    console.log(div, "dive-------");
    if (div) {
      if (event.target.value == "oneTime-purchase") {
        cartClear();
        div.style.display = "none";
      } else {
        div.style.display = "block";
        clearOnetimeProperties();
      }
    }
    setCartProperties();
  };

  if (allSellingPlans?.length == 1) {
    if (allSellingPlans) {
      purchaseOption = "subscription-purchase";
      sendPlanDataToCart(allSellingPlans[0]);
    }
  } else if (
    productJson?.options?.includes("Entries") &&
    allSellingPlans?.length == 0
  ) {
    if (
      productJson?.type.toLowerCase() == "bronze" ||
      productJson?.type.toLowerCase() == "silver" ||
      productJson?.type.toLowerCase() == "gold" ||
      productJson?.type.toLowerCase() == "platinum"
    ) {
      oneTimeMembership = true;
    }
    let data = productJson?.variants[0];
    let variant;
    if (
      data?.option1?.toLowerCase()?.includes("entry") ||
      data?.option1?.toLowerCase()?.includes("entries")
    ) {
      variant = data?.option1?.split(" ")[0];
    } else if (
      data?.option2?.toLowerCase()?.includes("entry") ||
      data?.option2?.toLowerCase()?.includes("entries")
    ) {
      variant = data?.option2?.split(" ")[0];
    } else if (
      data?.option3?.toLowerCase()?.includes("entry") ||
      data?.option3?.toLowerCase()?.includes("entries")
    ) {
      variant = data?.option3?.split(" ")[0];
    }

    if (Number(variant) > 0) {
      purchaseOption = "oneTime-purchase";
      handleOnetimePlan(variant);
    }
  } else {
    if (allSellingPlans?.length > 1) {
      commanData = JSON.parse(allSellingPlans[0]?.description);

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
                            <input type="radio" id="onetime-purchase" value='oneTime-purchase' name="purchase-option" />
                            <label for="onetime-purchase">
                            <div class='label'>One-time Purchase <span class='oneTimePrice'></span></div>
                            </label>
                        </div>
                        <div class='subscription-purchase'>
                            <input type="radio" id="subscription-purchase"  value='subscription-purchase' name="purchase-option" />
                            <label for="subscription-purchase">
                            <div  class='label'>Subscribe and Save Purchase <span class='subscriptionPrice'></span></div></label>
                            </div>
                            <div class='additional-detail'>
                              <ul class='inner-detail'>
                                <li><span id='entry'></span> into every giveaway.</li>
                                <li>Secure your name into every giveaway.</li>
                                <li>Never miss your opportunity.</li>
                                <li>Cheapest and most effective way to win.</li>
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

          // FIXED: Use event delegation instead of inline handlers
          const onetimeRadio = document.getElementById("onetime-purchase");
          const subscriptionRadio = document.getElementById(
            "subscription-purchase",
          );

          if (onetimeRadio) {
            onetimeRadio.addEventListener("change", window.handlePurchaseType);
            onetimeRadio.checked = true; // Set default selection
          }

          if (subscriptionRadio) {
            subscriptionRadio.addEventListener(
              "change",
              window.handlePurchaseType,
            );
          }

          const urlParams = new URLSearchParams(window.location.search);
          const variant = urlParams.get("variant");
          if (variant) {
            productJson?.variants?.map((item) => {
              if (item?.id == variant) {
                selectedEntries = item?.option1.split(" ")[0];
              }
            });

            setCartProperties();
          } else {
            selectedEntries = productJson?.variants[0]?.title?.split(" ")[0];
            setCartProperties();
          }
        }
      };

      const updateEntries = () => {
        let span = document.getElementById("entry");
        if (span) {
          span.innerText = `${selectedEntries} ${
            Number(selectedEntries) > 1 ? "entries" : "entry"
          }`;
        }
      };

      async function getCartData() {
        try {
          let cartApi = await fetch("/cart.json");
          let arr = await cartApi.json();
          return arr;
        } catch (error) {
          return [];
        }
      }

      const handlePlanChange = (newPlan) => {
        if (newPlan) {
          selectedPlan = newPlan;
          selectedEntries = getEntries(selectedPlan?.description);
          sendPlanDataToCart(selectedPlan);
          setPriceAndEntries(selectedPlan);
          updateEntries();
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
          let subscriptionBlock = document.getElementById(
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

      /***code for product page timer */
      const showCountDown = () => {
        const mediaGallery = document.querySelector("media-gallery");

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
        }
        const timer = setInterval(updateCountdown, 1000);
        updateCountdown();
      };

      document.addEventListener("DOMContentLoaded", () => {
        const ticketRadios = document.querySelectorAll(
          'input[type="radio"][name="Entries"]',
        );
        ticketRadios.forEach((radio) => {
          radio.addEventListener("click", () => {
            selectedEntries = radio?.value?.split(" ")[0];
            setCartProperties();
          });
        });
      });

      if (commanData?.raffleType == "time-limit") {
        const date = commanData?.dateRange;
        const startIST = toIST(date.start);
        let endIST = toIST(date.end);
        endIST.setHours(23, 59, 59, 999);

        let dateRange = { start: startIST, end: endIST };

        offerDuration = dateRange;
        const now = new Date();
        const timeDifferenceToStart = new Date(startIST) - now;

        if (timeDifferenceToStart < 0) {
          showCountDown();
        }
      } else {
        // console.log("no counter");
      }
    }
  }
}

function getProductIdFromModal() {
  const modal = document.querySelector(
    '.quickadd-modal, [class*="quickadd"], [class*="quick-add"], [class*="modal"]',
  );
  if (!modal) return null;

  // Try multiple methods to get product ID
  let productId = null;

  // Method 1: Check for data attributes
  productId =
    modal.getAttribute("data-product-id") ||
    modal.getAttribute("data-product") ||
    modal.querySelector("[data-product-id]")?.getAttribute("data-product-id");

  // Method 2: Check form action for product ID
  if (!productId) {
    const form = modal.querySelector('form[action*="/cart/add"]');
    if (form) {
      const formData = new FormData(form);
      productId = formData.get("id") || formData.get("product-id");
    }
  }

  // Method 3: Check URL parameters or hidden inputs
  if (!productId) {
    const hiddenInput = modal.querySelector(
      'input[name="id"], input[name="product-id"]',
    );
    if (hiddenInput) {
      productId = hiddenInput.value;
    }
  }

  // Method 4: Extract from product URL in modal
  if (!productId) {
    const productLinks = modal.querySelectorAll('a[href*="/products/"]');
    if (productLinks.length > 0) {
      const href = productLinks[0].href;
      const match = href.match(/\/products\/[^?]*\?.*variant=(\d+)/);
      if (match) {
        productId = match[1];
      }
    }
  }

  return productId;
}

// Function to check if modal is open and get product data
function checkModalAndInitialize() {
  const modal = document.querySelector(
    '.quickadd-modal, [class*="quickadd"], [class*="quick-add"], [class*="modal"]',
  );

  if (
    modal &&
    modal.style.display !== "none" &&
    !modal.classList.contains("hidden")
  ) {
    const productId = getProductIdFromModal();

    if (productId) {
      // console.log("Modal detected with product ID:", productId);
      initializeModalSubscriptionSystem(productId, modal);
    }
  }
}

// Add event listeners for modal detection
function setupModalDetection() {
  // Method 1: MutationObserver to detect modal changes
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === "childList") {
        // Check if any added nodes contain modal elements
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            // Element node
            if (
              node.classList &&
              (node.classList.contains("quickadd-modal") ||
                node.classList.contains("quick-add") ||
                node.classList.contains("modal"))
            ) {
              setTimeout(() => checkModalAndInitialize(), 100);
            }
          }
        });
      } else if (mutation.type === "attributes") {
        // Check for style or class changes that might indicate modal opening
        if (
          mutation.attributeName === "style" ||
          mutation.attributeName === "class"
        ) {
          setTimeout(() => checkModalAndInitialize(), 100);
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class"],
  });

  // Method 2: Event delegation for "Choose options" buttons
  document.addEventListener("click", function (e) {
    if (
      e.target.matches(
        'button:contains("Choose options"), .choose-options, [class*="choose"], [class*="quick"]',
      )
    ) {
      setTimeout(() => checkModalAndInitialize(), 500); // Delay to let modal open
    }
  });

  // Method 3: Periodic check (fallback)
  setInterval(checkModalAndInitialize, 2000);
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  setupModalDetection();
});

// Also run immediately if DOM is already loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupModalDetection);
} else {
  setupModalDetection();
}

// Enhanced version of your existing code
if (
  subscription_page_type == "product" ||
  subscription_page_type == "index" ||
  subscription_page_type == "collection" ||
  subscription_page_type == "page"
) {
  (async function () {
    // Your existing product page logic
    if (subscription_page_type == "product") {
      await getMultiplierData(productJson?.id);
      // console.log(multiplier, "multiplier------>");
      //
      if (multiplier > 1) {
        addBonusMultiplierBadge(multiplier);
      }

      // ... rest of your existing product page logic
    }

    // NEW: Modal detection and handling for index page

    if (
      subscription_page_type == "index" ||
      subscription_page_type == "collection" ||
      subscription_page_type == "page"
    ) {
      // console.log("helloo======");

      setupAddToCartListener();
      setupModalDetection();
    }

    // Your existing functions (keep all of them)
    // ... addBonusMultiplierBadge, sendOnetimeDataToCart, etc.
  })();
}

// NEW: Modal-specific functions
function setupModalDetection() {
  // console.log("Setting up modal detection for index page");

  // Detect when "Choose options" buttons are clicked
  document.addEventListener("click", function (e) {
    const target = e.target;
    // console.log("Click detected on:", target);

    // Check if clicked element is a "Choose options" button or has data-modal
    const dataModal =
      target.getAttribute("data-modal") ||
      target.closest("[data-modal]")?.getAttribute("data-modal");

    // console.log("Data-modal found:", dataModal);

    if (
      dataModal ||
      target.textContent.includes("Choose options") ||
      target.classList.contains("choose-options") ||
      target.closest('[class*="choose"]') ||
      target.closest('button[onclick*="quickadd"]') ||
      target.closest(".quick-add-btn") ||
      target.closest("[data-modal]")
    ) {
      // console.log("Modal trigger clicked, waiting for modal...");

      // Store the clicked element for product ID extraction
      const clickedElement = target.closest("[data-modal]") || target;

      // Wait for modal to open and then initialize
      setTimeout(async () => {
        await handleModalOpen(clickedElement);
      }, 300);

      // Also try with longer delay in case modal takes time to load
      setTimeout(async () => {
        await handleModalOpen(clickedElement);
      }, 800);
    }
  });

  // Watch for modal elements being added to DOM or becoming visible
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1 && node.classList) {
            // Check if this is a modal
            if (
              node.classList.contains("modal") ||
              node.classList.contains("quickadd") ||
              node.classList.contains("quick-add") ||
              node.id?.includes("QuickAdd") ||
              node.querySelector(
                '.modal, .quickadd, .quick-add, [id*="QuickAdd"]',
              )
            ) {
              // console.log("Modal element added to DOM:", node);
              setTimeout(async () => {
                await handleModalOpen();
              }, 100);
            }
          }
        });
      }

      // Watch for attribute changes (like style changes that show/hide modals)
      if (
        mutation.type === "attributes" &&
        (mutation.attributeName === "style" ||
          mutation.attributeName === "class")
      ) {
        const target = mutation.target;
        if (
          target.classList.contains("modal") ||
          target.classList.contains("quickadd") ||
          target.id?.includes("QuickAdd")
        ) {
          // Check if modal became visible
          const isVisible =
            target.style.display !== "none" &&
            !target.classList.contains("hidden") &&
            !target.hasAttribute("hidden");

          if (isVisible) {
            // console.log("Modal became visible:", target);
            setTimeout(async () => {
              await handleModalOpen();
            }, 100);
          }
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class", "hidden"],
  });
}

async function handleModalOpen(clickedElement = null) {
  // console.log("handleModalOpen called with:", clickedElement);

  // Find the modal - try multiple selectors
  let modal = null;

  // First, try to find modal using the data-modal attribute from clicked element
  if (clickedElement) {
    const dataModal =
      clickedElement.getAttribute("data-modal") ||
      clickedElement.closest("[data-modal]")?.getAttribute("data-modal");

    if (dataModal) {
      // Remove the # from "#QuickAdd-8409448874174"
      const modalId = dataModal.replace("#", "");
      modal = document.getElementById(modalId);
      // console.log("Modal found by ID:", modalId, modal);
    }
  }

  // If not found, try other methods
  if (!modal) {
    modal =
      document.querySelector(
        '.modal:not([style*="display: none"]), .quickadd:not([style*="display: none"]), .quick-add:not([style*="display: none"])',
      ) ||
      document.querySelector(
        '[class*="modal"][style*="display: block"], [class*="quickadd"][style*="display: block"]',
      ) ||
      document.querySelector(
        ".modal.is-open, .modal.active, .quickadd.is-open, .quickadd.active",
      ) ||
      document.querySelector(
        '[id*="QuickAdd"]:not([style*="display: none"])',
      ) ||
      document.querySelector('[id*="QuickAdd"][style*="display: block"]');

    // console.log("Modal found by general selectors:", modal);
  }

  // Also try finding recently added modals
  if (!modal) {
    const allModals = document.querySelectorAll(
      '[id*="QuickAdd"], .modal, .quickadd, .quick-add',
    );
    // console.log("All modals found:", allModals);

    // Find the visible one
    for (let m of allModals) {
      const computedStyle = window.getComputedStyle(m);
      const isVisible =
        computedStyle.display !== "none" &&
        computedStyle.visibility !== "hidden" &&
        computedStyle.opacity !== "0" &&
        !m.hasAttribute("hidden") &&
        !m.classList.contains("hidden");

      if (isVisible) {
        modal = m;
        // console.log("Found visible modal:", modal);
        break;
      }
    }
  }

  if (!modal) {
    // console.log("No modal found");
    return;
  }

  // console.log("Modal found:", modal);

  // Extract product ID from modal
  const productId = await extractProductIdFromModal(modal, clickedElement);

  if (!productId) {
    // console.log("Could not extract product ID from modal");
    return;
  }

  // console.log("Product ID extracted:", productId);

  // Get multiplier data for this product
  await getMultiplierData(productId);

  // Initialize modal with subscription options
  await initializeModalSubscriptionSystem(modal, productId);
}

async function extractProductIdFromModal(modal, clickedElement = null) {
  let productId = null;

  // console.log("Extracting product ID from modal:", modal);
  // console.log("Clicked element:", clickedElement);

  // Method 1: Check clicked element for data-modal attribute (most reliable for your case)
  if (clickedElement) {
    const dataModal = clickedElement.getAttribute("data-modal");
    // console.log("data-modal attribute:", dataModal);

    if (dataModal) {
      // Extract ID from "#QuickAdd-8409448874174" format
      const match = dataModal.match(/#QuickAdd-(\d+)/);
      if (match) {
        productId = match[1];
        // console.log("Product ID extracted from data-modal:", productId);
      }
    }
  }

  // Method 2: Check modal ID attribute
  if (!productId) {
    const modalId = modal.getAttribute("id");
    // console.log("Modal ID:", modalId);

    if (modalId) {
      // Extract from "QuickAdd-8409448874174" format
      const match = modalId.match(/QuickAdd-(\d+)/);
      if (match) {
        productId = match[1];
        // console.log("Product ID extracted from modal ID:", productId);
      }
    }
  }

  // Method 3: Check modal data attributes
  if (!productId) {
    productId =
      modal.getAttribute("data-product-id") ||
      modal.getAttribute("data-product") ||
      modal.dataset.productId ||
      modal.dataset.product;
    if (productId) {
      // console.log("Product ID from modal data attributes:", productId);
    }
  }

  // Method 4: Check form in modal
  if (!productId) {
    const form = modal.querySelector('form[action*="/cart/add"]');
    if (form) {
      const idInput = form.querySelector('input[name="id"]');
      if (idInput) {
        productId = idInput.value;
        // console.log("Product ID from form input:", productId);
      }
    }
  }

  // Method 5: Check clicked element's parent product card
  if (!productId && clickedElement) {
    const productCard = clickedElement.closest(
      "[data-product-id], [data-product], .product-card, .product-item",
    );
    if (productCard) {
      productId =
        productCard.getAttribute("data-product-id") ||
        productCard.getAttribute("data-product") ||
        productCard.dataset.productId ||
        productCard.dataset.product;
      if (productId) {
        // console.log("Product ID from product card:", productId);
      }
    }
  }

  // Method 6: Check if modal has a class with product ID
  if (!productId) {
    const modalClasses = modal.className;
    const match = modalClasses.match(/product-(\d+)|quickadd-(\d+)/i);
    if (match) {
      productId = match[1] || match[2];
      // console.log("Product ID from modal classes:", productId);
    }
  }

  // Method 7: Check product links in modal and extract from URL
  if (!productId) {
    const productLink = modal.querySelector('a[href*="/products/"]');
    if (productLink) {
      const href = productLink.href;
      // console.log("Product link found:", href);

      // Try to extract product ID from URL parameters
      const urlParams = new URLSearchParams(href.split("?")[1] || "");
      const variantId = urlParams.get("variant");
      if (variantId) {
        productId = variantId;
        // console.log("Product ID from URL variant:", productId);
      } else {
        // Extract product handle and fetch product data
        const urlParts = href.split("/");
        const productHandle =
          urlParts[urlParts.indexOf("products") + 1]?.split("?")[0];

        if (productHandle) {
          try {
            // console.log("Fetching product data for handle:", productHandle);
            const response = await fetch(`/products/${productHandle}.js`);
            const productData = await response.json();
            productId = productData.id;
            // console.log("Product ID from fetched data:", productId);
          } catch (error) {
            console.error("Error fetching product data:", error);
          }
        }
      }
    }
  }

  // console.log("Final extracted product ID:", productId);
  return productId;
}

const extractEntriesFromProduct = (data) => {
  const variants = data?.variants?.edges || [];
  const options = data?.options || [];

  const hasEntriesOption = options.some(
    (opt) => opt?.name?.toLowerCase() === "entries",
  );
  // console.log(hasEntriesOption, "hasEntriesOption----->");

  if (!hasEntriesOption || variants.length === 0) return;

  // Look for first variant that includes "Entries"
  for (const edge of variants) {
    const selectedOptions = edge?.node?.selectedOptions || [];

    for (const opt of selectedOptions) {
      const value = opt?.value?.toLowerCase?.();

      if (value?.includes("entries")) {
        const match = value.match(/\d+/);
        // console.log(match, "selectedOptions=====>");
        if (match) {
          const entries = Number(match[0]);
          // console.log(entries, "entries=======>");

          if (entries > 0) {
            // ✅ Found valid entry value

            return entries; // optionally return
          }
        }
      }
    }
  }
};

async function initializeModalSubscriptionSystem(modal, productId) {
  // console.log("Initializing modal subscription system for product:", productId);

  const multiplier = await getMultiplierData(productId); // returns a number

  if (multiplier && !isNaN(multiplier)) {
    addModalMultiplierBadge(modal, multiplier);
    await handleMultiplierLogic(productId, multiplier);
  } else {
    console.warn("No valid multiplier found");
  }
}

function addModalMultiplierBadge(modal, multiplier) {
  const entriesSection =
    modal.querySelector('.entries, [class*="entries"], .product-form__input') ||
    modal
      .querySelector('input[name*="entries"], input[name*="Entries"]')
      ?.closest(".form-group, .field, div");

  if (!entriesSection) return;
  if (multiplier <= 1) return;

  const entriesInput = modal.querySelector('input[name="Entries"]');
  if (!entriesInput) return;

  const parent = entriesInput.parentElement;
  const label = parent.querySelector("label");

  // Remove existing badge if present
  const oldBadge = parent.querySelector(".bonus-badge");
  if (oldBadge) oldBadge.remove();

  if (label) {
    const val = parseFloat(entriesInput.value) * parseFloat(multiplier);

    // ✅ Add custom class to label
    label.classList.add("bonus-badge-label");
    label.style.display = "inline-block";
    label.style.padding = "0";
    label.style.border = "none";
    label.style.background = "transparent";
    label.style.overflow = "visible";

    // Create main badge container
    const badge = document.createElement("div");
    badge.className = "bonus-badge";
    badge.style.display = "inline-flex";
    badge.style.alignItems = "center";
    badge.style.borderRadius = "50px";
    badge.style.overflow = "hidden";
    badge.style.fontWeight = "bold";
    badge.style.fontSize = "16px";

    // Left side (value part)
    const leftDiv = document.createElement("div");
    leftDiv.className = "bonus-badge-left";
    leftDiv.innerText = `${val} ENTRIES`;
    leftDiv.style.background = "#000";
    leftDiv.style.color = "#fff";
    leftDiv.style.padding = "15px 22px";
    leftDiv.style.borderTopRightRadius = "50px";
    leftDiv.style.borderBottomRightRadius = "50px";
    leftDiv.style.position = "relative";
    leftDiv.style.zIndex = "2";

    // Right side (bonus part)
    const rightDiv = document.createElement("div");
    rightDiv.className = "bonus-badge-right";
    rightDiv.innerText = ` ${multiplier}X`;

    rightDiv.style.background = "red";
    rightDiv.style.color = "#fff";
    rightDiv.style.padding = "14px 32px";
    rightDiv.style.fontStyle = "italic";
    rightDiv.style.textShadow = "0 0 5px rgba(255,255,255,0.8)";
    rightDiv.style.position = "relative";
    rightDiv.style.left = "0";
    rightDiv.style.zIndex = "1";
    rightDiv.style.marginLeft = "-25px";
    rightDiv.style.borderRadius = "0px 50px 50px 0px";

    // Append parts
    badge.appendChild(leftDiv);
    badge.appendChild(rightDiv);

    // Replace label content with badge
    label.innerHTML = "";
    label.appendChild(badge);
  }
}

// Handle multiplier logic - adds entries and plan-type to all cart forms
async function handleMultiplierLogic(productId, multiplier) {
  // Extract multiplier from multiplierData (adjust based on your data structure)
  if (multiplier) {
    const data = await getProductData(productId);
    if (data) {
      const entry = extractEntriesFromProduct(data);
      // console.log(entry, "entry------->");

      const productForms = document.querySelectorAll(
        'form[action="/cart/add"]',
      );
      let totalEntries = parseFloat(entry) * parseFloat(multiplier);

      productForms.forEach((form) => {
        if (!form) return;

        // Ensure 'entries' field
        let entriesInput = form.querySelector(
          'input[name="properties[entries]"]',
        );
        if (!entriesInput) {
          entriesInput = document.createElement("input");
          entriesInput.type = "hidden";
          entriesInput.name = "properties[entries]";
          form.appendChild(entriesInput);
        }
        entriesInput.value = totalEntries;

        // Ensure 'plan-type' field
        let typeInput = form.querySelector(
          'input[name="properties[plan-type]"]',
        );
        if (!typeInput) {
          typeInput = document.createElement("input");
          typeInput.type = "hidden";
          typeInput.name = "properties[plan-type]";
          form.appendChild(typeInput);
        }
        typeInput.value = "onetime";
      });
    }
  }
}

function setupAddToCartListener() {
  const addToCartButtons = document.querySelectorAll('button[name="add"]');

  addToCartButtons.forEach((button) => {
    button.addEventListener("click", async function handler(e) {
      e.preventDefault(); // Stop Shopify's native behavior temporarily

      const form = button.closest("form");
      const productIdInput = form?.querySelector('input[name="product-id"]');
      const productId = productIdInput?.value;

      try {
        if (productId) {
          // console.log("Product ID:", productId);
          const multiplierData = await getMultiplierData(productId);

          // console.log("Multiplier data:", multiplierData);
          await handleMultiplierLogic(productId, multiplierData);
        }

        // Allow the real Add to Cart to happen now
        button.removeEventListener("click", handler); // Prevent infinite loop
        button.click();
        button.addEventListener("click", handler); // Reattach for next click
      } catch (error) {
        console.error("Error in multiplier logic:", error);
        button.removeEventListener("click", handler);
        button.click();
        button.addEventListener("click", handler);
      }
    });
  });
}

// Main function to run on page load

// Process individual product
async function processProduct(productId) {
  try {
    // Get the card element
    const cardElement = document.querySelector(
      `.card__content[data-id="${productId}"]`,
    );
    if (!cardElement) {
      console.warn(`Card not found for product ID: ${productId}`);
      return;
    }

    // Show loading state
    showLoadingState(cardElement);

    // Step 1: Get multiplier data
    const multiplierData = await getMultiplierData(productId);
    // Step 2: Get product data
    const productData = await getProductData(productId);

    // Step 3: Extract entries from product data
    const entries = extractEntriesFromProduct(productData);

    // Step 4: Display the information above buttons
    displayProductInfo(cardElement, multiplierData, entries);
  } catch (error) {
    console.error(`Error processing product ${productId}:`, error);
    showErrorState(
      document.querySelector(`.card__content[data-id="${productId}"]`),
      error,
    );
  }
}

// Show loading state
function showLoadingState(cardElement) {
  const existingInfo = cardElement.querySelector(".product-data-info");
  if (existingInfo) {
    existingInfo.remove();
  }

  const loadingDiv = document.createElement("div");
  loadingDiv.className = "product-data-info loading";
  loadingDiv.innerHTML =
    '<span style="color: #666; font-size: 12px;">Loading...</span>';

  // Insert before the button
  const button = cardElement.querySelector(
    'button, .card__button, [class*="button"]',
  );
  if (button) {
    button.parentNode.insertBefore(loadingDiv, button);
  } else {
    cardElement.appendChild(loadingDiv);
  }
}

// Show error state
function showErrorState(cardElement, error) {
  if (!cardElement) return;

  const existingInfo = cardElement.querySelector(".product-data-info");
  if (existingInfo) {
    existingInfo.remove();
  }

  const errorDiv = document.createElement("div");
  errorDiv.className = "product-data-info error";
  errorDiv.innerHTML = `<span style="color: #dc2626; font-size: 12px;">Error: ${error.message}</span>`;

  const button = cardElement.querySelector(
    'button, .card__button, [class*="button"]',
  );
  if (button) {
    button.parentNode.insertBefore(errorDiv, button);
  } else {
    cardElement.appendChild(errorDiv);
  }
}

// Display product information above buttons
function displayProductInfo(cardElement, multiplierData, entries) {
  // Remove old info
  const existingInfo = cardElement.querySelector(
    ".product-data-info, .multiplier-badge-wrapper",
  );
  if (existingInfo) existingInfo.remove();

  const button = cardElement.querySelector(
    'button, .card__button, [class*="button"]',
  );
  const priceEl = cardElement.querySelector(
    '.price, .product-price, [class*="price"]',
  ); // ✅ Find price

  if (!entries || entries <= 0) return;

  const multiplier = parseFloat(multiplierData) || 1;
  const showMultiplier = multiplier > 1;
  const val = entries * multiplier;

  // Main badge container
  const badge = document.createElement("div");
  badge.className = "multiplier-badge-wrapper product-data-info";
  badge.style.display = "inline-flex";
  badge.style.alignItems = "center";
  badge.style.borderRadius = "50px";
  badge.style.overflow = "hidden";
  badge.style.fontWeight = "bold";
  badge.style.fontSize = "16px";
  badge.style.marginTop = "0.5rem"; // margin for below price
  badge.style.marginBottom = "1.7rem";

  // Left side (entries)
  const leftDiv = document.createElement("div");
  leftDiv.innerText = `${val} ENTRIES`;
  leftDiv.style.background = "#000";
  leftDiv.style.color = "#fff";
  leftDiv.style.padding = "10px 32px";
  leftDiv.style.borderTopRightRadius = "50px";
  leftDiv.style.borderBottomRightRadius = "50px";
  leftDiv.style.position = "relative";
  leftDiv.style.zIndex = "2";
  badge.appendChild(leftDiv);

  // Right side (multiplier, only if > 1)
  if (showMultiplier) {
    const rightDiv = document.createElement("div");
    rightDiv.innerText = ` ${multiplier}X`;
    rightDiv.style.background = "red";
    rightDiv.style.color = "#fff";
    rightDiv.style.padding = "9px 32px";
    rightDiv.style.fontStyle = "italic";
    rightDiv.style.textShadow = "0 0 5px rgba(255,255,255,0.8)";
    rightDiv.style.position = "relative";
    rightDiv.style.left = "0";
    rightDiv.style.zIndex = "1";
    rightDiv.style.marginLeft = "-25px";
    rightDiv.style.animation = "blink 1s ease-in-out infinite";
    rightDiv.style.borderRadius = "50px";
    rightDiv.style.borderTopLeftRadius = "0";
    rightDiv.style.borderBottomLeftRadius = "0";
    badge.appendChild(rightDiv);

    // Add flash animation keyframes only once
    if (!document.querySelector("#flash-animation-style")) {
      const style = document.createElement("style");
      style.id = "flash-animation-style";
      style.innerHTML = `
        @keyframes blink {
          0% { opacity: .2 }
          15% { opacity: 1 }
          85% { opacity: 1 }
          to { opacity: .2 }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Insert above button OR below price
  if (button) {
    button.parentNode.insertBefore(badge, button);
  } else if (priceEl) {
    priceEl.insertAdjacentElement("afterend", badge);
  }
}

// Simple global loader
function showGlobalLoader() {
  // Remove existing loader if any
  hideGlobalLoader();

  const loader = document.createElement("div");
  loader.id = "global-loader";
  loader.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-size: 18px;
    color: white;
    font-weight: bold;
  `;
  loader.innerHTML = "Loading...";
  document.body.appendChild(loader);
}

// Hide global loader
function hideGlobalLoader() {
  const loader = document.getElementById("global-loader");
  if (loader) {
    loader.remove();
  }
}
console.log("fsfs");
document.addEventListener("DOMContentLoaded", () => {
  console.log("fdfd");
  loadAllProductData();
});
// Load all product data
function loadAllProductData() {
  console.log("fdsfddfdf");
  try {
    showGlobalLoader();

    const productCards = document.querySelectorAll(".card__content[data-id]");
    const productIds = Array.from(productCards).map((card) => card.dataset.id);

    for (const productId of productIds) {
      processProduct(productId);
    }
  } catch (error) {
    console.error("Error loading product data:", error);
  } finally {
    hideGlobalLoader();
  }
}
