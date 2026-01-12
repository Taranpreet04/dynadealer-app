import React, { useState } from "react";
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  ResourceList,
  ResourceItem,
  Checkbox,
  Filters,
  InlineStack,
  Text,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useSubmit, useLoaderData, useNavigation } from "@remix-run/react";
import {
  getMultiplierData,
  saveMultiplierData,
} from "../controllers/planController";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  console.log("shop in loader ===>", session.shop);
  const response = await getMultiplierData(session.shop);
  if (response.status !== 200) {
    return {
      isManualEnabled: false,
      isAllEnabled: false,
      allProductMultiplier: "",
      products: [],
    };
  }

  return {
    isManualEnabled:
      response.data.isManualEnabled === "true" ||
      response.data.isManualEnabled === true,
    isAllEnabled:
      response.data.isAllEnabled === "true" ||
      response.data.isAllEnabled === true,
    allProductMultiplier: response.data.allProductMultiplier || "",
    products: response.data.products || [],
  };
};
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const body = await request.formData();
  let isManualEnabled = body.get("isManualEnabled");
  let isAllEnabled = body.get("isAllEnabled");
  let allProductMultiplier = body.get("allProductMultiplier");
  let products = body.get("products");
  let arr = JSON.parse(products);
  console.log("arr in action:", isAllEnabled, isManualEnabled);
  let saveData = await saveMultiplierData(session.shop, {
    isManualEnabled,
    isAllEnabled,
    allProductMultiplier,
    arr,
  });

  return null;
};
export default function BonusMultiplier() {
  let submit = useSubmit();
  const loaderData = useLoaderData();
  const navigation = useNavigation();

  const [allProductMultiplier, setAllProductMultiplier] = useState(
    loaderData.allProductMultiplier || ""
  );
  const [planDetail, setPlanDetail] = useState({
    products: loaderData.products || [],
  });
  const [isAllEnabled, setIsAllEnabled] = useState(loaderData.isAllEnabled);
  const [isManualEnabled, setIsManualEnabled] = useState(
    loaderData.isManualEnabled
  );

  const handleResourcePicker = async () => {
    let ids = planDetail?.products?.map((item) => ({ id: item.product_id }));

    const productPickerData = await shopify.resourcePicker({
      type: "product",
      multiple: true,
      selectionIds: ids,
      filter: { draft: false, variants: false },
    });

    if (!productPickerData) return;

    let sendData = productPickerData.map((item) => {
      const existing = planDetail.products.find(
        (p) => p.product_id === item.id
      );
      return {
        product_id: item.id,
        handle: item.handle,
        product_name: item.title,
        product_image: item?.images?.[0]?.originalSrc ?? "",
        hasOnlyDefaultVariant: item.hasOnlyDefaultVariant,
        subscription_type: "inactive",
        multiplier: existing?.multiplier || "",
      };
    });

    setPlanDetail({ ...planDetail, products: sendData });
  };

  const updateProductMultiplier = (productId, value) => {
    const updatedProducts = planDetail.products.map((product) =>
      product.product_id === productId
        ? { ...product, multiplier: value }
        : product
    );
    setPlanDetail({ ...planDetail, products: updatedProducts });
  };

  const removeProduct = (productId) => {
    const updatedProducts = planDetail.products.filter(
      (product) => product.product_id !== productId
    );
    setPlanDetail({ ...planDetail, products: updatedProducts });
  };

  return (
    <Page
      fullWidth
      title="Bonus Product Multiplier"
      primaryAction={{
        content: "Save",
        loading: navigation.state === "submitting", // <-- Loader here
        onAction: () => {
          const formData = new FormData();
          formData.append("isManualEnabled", isManualEnabled);
          formData.append("isAllEnabled", isAllEnabled);
          formData.append("allProductMultiplier", allProductMultiplier);
          formData.append("products", JSON.stringify(planDetail));

          submit(formData, { method: "post" });
        },
      }}
    >
      <InlineStack align="start" blockAlign="center">
        <Text as="span" variant="bodySm" tone="subdued">
          Note: If both manual and all-product multipliers are enabled,{" "}
          <b>manual multipliers will take priority</b> for matching products.
        </Text>
      </InlineStack>
      <Layout.Section>
        <Card title="All Products">
          <Checkbox
            label="Enable All Products Multiplier"
            checked={isAllEnabled}
            onChange={() => {
              setIsAllEnabled(!isAllEnabled);
              setAllProductMultiplier("");
            }}
          />
          {isAllEnabled && (
            <div style={{ marginTop: "1rem", width: "300px" }}>
              <TextField
                label="Multiplier for all products"
                type="number"
                value={isAllEnabled ? allProductMultiplier : ""}
                onChange={setAllProductMultiplier}
              />
            </div>
          )}
        </Card>
      </Layout.Section>

      <Layout.Section>
        <Card title="Manual Product ">
          <Checkbox
            label="Enable Manual Product Multipliers"
            checked={isManualEnabled}
            onChange={setIsManualEnabled}
          />
          {isManualEnabled && (
            <>
              <div style={{ marginTop: "1rem" }}>
                <Button onClick={handleResourcePicker}>Select Products</Button>
              </div>

              {planDetail.products.length > 0 ? (
                <div style={{ marginTop: "1rem" }}>
                  <ResourceList
                    resourceName={{ singular: "variant", plural: "variants" }}
                    items={planDetail.products}
                    renderItem={(item) => (
                      <ResourceItem id={item.product_id}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                            }}
                          >
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              style={{
                                width: 40,
                                height: 40,
                                objectFit: "cover",
                                borderRadius: 4,
                              }}
                            />
                            <strong>{item.product_name}</strong>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <TextField
                              label="Multiplier"
                              labelHidden
                              type="number"
                              value={item.multiplier || ""}
                              onChange={(value) =>
                                updateProductMultiplier(item.product_id, value)
                              }
                            />
                            <Button
                              onClick={() => removeProduct(item.product_id)}
                              destructive
                              size="slim"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </ResourceItem>
                    )}
                  />
                </div>
              ) : (
                <p style={{ marginTop: "1rem" }}>No product selected</p>
              )}
            </>
          )}
        </Card>
      </Layout.Section>
    </Page>
  );
}
