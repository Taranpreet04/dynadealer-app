import { json } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useSubmit,
  useParams,
  useNavigate,
} from "@remix-run/react";
import { useEffect, useState, useCallback } from "react";
import {
  checkProductSubscription,
  createPlan,
  getPlanById,
  updatePlanById,
} from "../controllers/planController";
import { authenticate } from "../shopify.server";
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import {
  Button,
  ChoiceList,
  Page,
  Card,
  ResourceList,
  Avatar,
  ResourceItem,
  Text,
  Icon,
  TextField,
  BlockStack,
  Grid,
  Select,
  Modal,
  Box,
  Checkbox,
  InlineStack,
  Popover,
  ActionList,
} from "@shopify/polaris";
import planStyles from "../styles/planCreate.css?url";
import TableSkeleton from "../components/tableSkeleton";
import ContentSkeleton from "../components/contentSkeleton";
import DateRangePicker from "../components/datePicking";

export const links = () => [{ rel: "stylesheet", href: planStyles }];

export const loader = async ({ params, request }) => {
  const { admin, session } = await authenticate.admin(request);
  if (params?.id == "create") {
    return null;
  } else {
    const data = await getPlanById(admin, params?.id);
    return json(data?.response);
  }
};

export const action = async ({ params, request }) => {
  const { admin } = await authenticate.admin(request);
  const { shop } = admin.rest.session;
  const formData = await request.formData();
  const updatePlans = JSON.parse(formData.get("updatePlans"));
  const deletePlans = JSON.parse(formData.get("deletePlans"));
  const dbProducts = JSON.parse(formData.get("dbProducts"));
  const newPlans = JSON.parse(formData.get("newPlans"));
  const plan_group_id = formData.get("plan_group_id");
  const offerValidity = JSON.parse(formData.get("offerValidity"));

  const newPlanDetails = {
    shop: shop,
    name: formData.get("name"),
    sellingPlanUpdate: formData.get("sellingPlanUpdate"),
    upgradeTo: formData.get("upgradeTo"),
    futureEntries: formData.get("futureEntries") || 1,
    raffleType: formData.get("raffleType"),
    showOnPortal: formData.get("showOnPortal"),
    spots: formData.get("spots") || 1,
    products: JSON.parse(formData.get("products")),
    plans: JSON.parse(formData.get("plans")),
    offerValidity: offerValidity,
  };
  try {
    let detail = { updatePlans, deletePlans, newPlans, dbProducts };
    let planDetails = {
      success: false,
      error: "Product has already subscription plans",
    };

    let checkProduct = await checkProductSubscription(
      newPlanDetails,
      params?.id,
    );
  
    if (!checkProduct) {
      if (params?.id == "create") {
        planDetails = await createPlan(admin, newPlanDetails);
        // planDetails = await createPlanAndVariants(admin, newPlanDetails);
      } else {
        planDetails = await updatePlanById(
          admin,
          { id: params?.id, plan_group_id: plan_group_id },
          newPlanDetails,
          detail,
        );
      }
    }

    return json(planDetails);
  } catch (error) {
    console.error("Error creating plan details:", error);
    return json({
      success: false,
      error: "Failed to create plan details......in action",
    });
  }
};

export default function CreateUpdatePlan() {
  const navigate = useNavigate();
  const loaderData = useLoaderData();
  const submit = useSubmit();
  const actionData = useActionData();
  let { id } = useParams();
  const [sellingPlanModal, setSellingPlanModal] = useState(false);
  const [deleteSellingPlan, setDeleteSellingPlan] = useState("");
  const [existPlanType, setExistPlanType] = useState(false);
  const [minCycleErr, setMinCycleErr] = useState(false);
  const [planNameExist, setPlanNameExist] = useState(false);
  const [editSellingPlan, setEditSellingPlan] = useState(false);
  const [deletePlans, setDeletePlans] = useState([]);
  const [dbProducts, setDbProducts] = useState([]);
  const [tableSkel, setTableSkel] = useState(false);
  const [contentSkel, setContentSkel] = useState(false);
  const [btnLoader, setBtnLoader] = useState(false);
  const [updatePlanIndex, setUpdatePlanIndex] = useState(-1);
  const [newPlan, setNewPlan] = useState({
    name: "",
    entries: 1,
    purchaseType: "month",
    mincycle: 1,
    price: "",
    exclusiveDraw: false,
  });
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const resetToMidnight = (date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };
  const [planDetail, setPlanDetail] = useState({
    name: "",
    sellingPlanUpdate: false,
    upgradeTo: "bronze",
    futureEntries: 5,
    raffleType: "capped",
    spots: 1,
    plans: [],
    products: [],
    showOnPortal: false
  });
  const [originalData, setOriginalData] = useState({
    name: "",
    plans: [],
    products: [],
  });

  useEffect(() => {
    shopify.loading(true);
    const toIST = (dateString) => {
      const date = new Date(dateString);
      const offsetInMinutes = 330;
      return new Date(date.getTime() - offsetInMinutes * 60 * 1000);
    };
    if (loaderData !== null) {
    
      const dates = {
        start: new Date(toIST(loaderData?.offerValidity?.start)),
        end: new Date(toIST(loaderData?.offerValidity?.end)),
      };
      setPlanDetail({ ...loaderData, offerValidity: dates });
      setOriginalData({ ...loaderData, offerValidity: dates });
      setDbProducts([...loaderData?.products]);
    } else {
      setPlanDetail({
        ...planDetail,
        offerValidity: {
          start: resetToMidnight(new Date()),
          end: resetToMidnight(
            new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000),
          ),
        },
      });
    }
    shopify.loading(false);
  }, [loaderData]);

  const handleSavePlan = () => {
    let oneTimePlanExist = false;
    planDetail?.plans?.map((plan) => {
      if (plan?.purchaseType == "day") {
        oneTimePlanExist = true;
      }
    });
    if (planDetail?.name.trim() == "") {
      shopify.toast.show("Name is required.", { duration: 5000 });
    } else if (planDetail?.plans?.length <= 0) {
      shopify.toast.show("Minimum one selling plan is required.", {
        duration: 5000,
      });
    } else if (planDetail?.products?.length <= 0) {
      shopify.toast.show("Minimum one product is required.", {
        duration: 5000,
      });
    } else if (planDetail?.sellingPlanUpdate && oneTimePlanExist) {
      shopify.toast.show(
        "Please remove the one-time plan, as you intend to upgrade it next month.",
        { duration: 5000 },
      );
    } else {
      let newPlans = [];
      let updatePlans = [];
      planDetail?.plans?.map((item) => {
        item?.plan_id ? updatePlans?.push(item) : newPlans?.push(item);
      });
      if (JSON.stringify(originalData) !== JSON.stringify(planDetail)) {
    
        let formData = {
          ...planDetail,
          plans: JSON.stringify(planDetail?.plans),
          products: JSON.stringify(planDetail?.products),
          newPlans: JSON.stringify(newPlans),
          updatePlans: JSON.stringify(updatePlans),
          deletePlans: JSON.stringify(deletePlans),
          dbProducts: JSON.stringify(dbProducts),
          offerValidity: JSON.stringify(planDetail?.offerValidity),
        };
        shopify.loading(true);
        setBtnLoader(true);
        submit(formData, {
          method: "post",
        });
      } else {
        shopify.toast.show("No Changes Found", { duration: 5000 });
      }
    }
  };

  const handleResourcePicker = async () => {
    let ids = [];
    planDetail?.products?.map((item) => {
      let variants = [];
      item.variants.map((itm) => {
        variants.push({ id: itm.id });
      });
      ids.push({
        id: item.product_id,
        variants: variants,
      });
    });
    const productPickerData = await shopify.resourcePicker({
      type: "product",
      filter: {
        draft: false,
        variants: false,
      },
      multiple: true,
      selectionIds: ids,
    });
    let sendData = [];
    if (productPickerData !== undefined) {
      productPickerData?.map((item) => {
        let p_id = item.id;
        let variants = [];
        item.variants.map((itm) => {
          let v_id = itm.id;
          variants.push({
            id: v_id,
            title: itm.title,
            image: itm?.image?.originalSrc ? itm.image.originalSrc : "",
            price: itm.price,
          });
        });

        sendData.push({
          product_id: p_id,
          handle: item.handle,
          product_name: item.title,
          product_image:
            item?.images.length > 0 ? item.images[0].originalSrc : "",
          hasOnlyDefaultVariant: item.hasOnlyDefaultVariant,
          variants: variants,
          subscription_type: "inactive",
        });
      });
      setPlanDetail({ ...planDetail, products: sendData });
    }
  };

  useEffect(() => {
    if (actionData?.success) {
      id == "create"
        ? shopify.toast.show("Plan successfully created.", { duration: 5000 })
        : shopify.toast.show("Plan successfully updated.", { duration: 5000 });
      setBtnLoader(false);
      setTableSkel(true);
      navigate("/app/plans");
    } else if (actionData?.success == false) {
      shopify.toast.show(`${actionData?.error}`, { duration: 5000 });
      shopify.loading(false);
      setBtnLoader(false);
    }
    shopify.loading(false);
  }, [actionData]);

  const options = [
    // { label: "One-time", value: "day" },
    { label: "Monthly", value: "month" },
    // { label: "Weekly", value: "week" },
    // { label: "Yearly", value: "year" },
  ];
  const upgradeOptions = [
    { label: "Bronze", value: "bronze" },
    { label: "Silver", value: "silver" },
    { label: "Gold", value: "gold" },
    { label: "Platinum", value: "platinum" },
  ];

  const handleModalValChange = (val, name) => {
    let match = 0;
    let planName = newPlan?.name;
    if (name == "name") {
      planDetail?.plans?.map((item) => {
        if (item?.name.trim() == val.trim() && !editSellingPlan) {
          match = 1;
        }
      });
    }
    if (match == 1) {
      match = 0;
      setPlanNameExist(true);
    } else {
      setPlanNameExist(false);
    }

    if (newPlan?.purchaseType !== "day" && name == "mincycle" && val <= 0) {
      setMinCycleErr(true);
    } else if (newPlan?.mincycle <= 0) {
      setMinCycleErr(true);
    } else {
      setMinCycleErr(false);
    }

    if (val == "day") {
      setNewPlan({
        ...newPlan,
        [name]: name === "price" ? (val ? parseFloat(val) : "") : val,
        mincycle: 1,
      });
    } else {
      setNewPlan({
        ...newPlan,
        [name]: name === "price" ? (val ? parseFloat(val) : "") : val,
      });
    }
  };

  const handleChange = (val, name) => {
    setPlanDetail({
      ...planDetail,
      [name]: val,
    });
  };
 
  const handleDeleteProduct = (id) => {
    let products = planDetail?.products?.filter(
      (item) => item?.product_id !== id,
    );
    setPlanDetail({ ...planDetail, products: products });
  };

  const handleAddPlan = () => {
   
    if (!editSellingPlan) {
      let match = 0;
      let nameExist = 0;
      planDetail?.plans?.map((item) => {
        if (item?.name == `${newPlan?.name.trim()}-entries-${item?.entries}`) {
          nameExist = 1;
          setPlanNameExist(true);
        }
      });
   
      if (newPlan?.name.trim() === "") {
        shopify.toast.show("Plan name is required", { duration: 5000 });
      } else if (planNameExist || nameExist === 1) {
        shopify.toast.show("Plan name should be unique", { duration: 5000 });
      } else if (existPlanType || match > 0) {
        shopify.toast.show("Plan already exist.", { duration: 5000 });
      } else if (
        minCycleErr ||
        (!(newPlan?.mincycle >= 1) && newPlan?.purchaseType !== "day")
      ) {
        shopify.toast.show(
          "Minimum cycle should be greater than or equal to 1.",
          { duration: 5000 },
        );
      } else if (newPlan?.price == "" || parseInt(newPlan?.price) <= 0) {
        shopify.toast.show("Price is required", { duration: 5000 });
      } else {
        setEditSellingPlan(false);
        let editPlanName = {
          ...newPlan,
          name: newPlan?.name.trim() + "-entries-" + newPlan?.entries,
        };
        let newPlans = [...planDetail?.plans, editPlanName];
        setPlanDetail({ ...planDetail, plans: newPlans });
        setNewPlan({
          name: "",
          entries: 1,
          purchaseType: "month",
          mincycle: 1,
          price: "",
          exclusiveDraw: false,
        });
      }
    }
  };
  const handleUpdatePlan = () => {
    if (editSellingPlan) {
      let plans = [];
      let nameExist = 0;
      planDetail?.plans?.map((item) => {
        if (
          item?.name == `${newPlan?.name.trim()}-entries-${newPlan?.entries}`
        ) {
          nameExist = nameExist + 1;
          setPlanNameExist(true);
        }
      });
      if (newPlan?.name === "") {
        shopify.toast.show("Plan name is required", { duration: 5000 });
      } else if (planNameExist || nameExist >= 1) {
        shopify.toast.show("Plan name should be unique", { duration: 5000 });
      } else if (
        minCycleErr ||
        (!(newPlan?.mincycle >= 1) && newPlan?.purchaseType !== "day")
      ) {
        setMinCycleErr(true);
        shopify.toast.show(
          "Minimum cycle should be greater than or equal to 1.",
          { duration: 5000 },
        );
      } else if (newPlan?.price == "" || parseInt(newPlan?.price) <= 0) {
        shopify.toast.show("Price is required", { duration: 5000 });
      } else {
        setEditSellingPlan(false);
        planDetail?.plans?.map((item, index) => {
          if (index == updatePlanIndex) {
            if (newPlan?.name?.includes("-entries-")) {
              let newPlanName =
                newPlan?.name.split("-entries-")[0] +
                "-entries-" +
                newPlan?.entries;
              let editPlanName = { ...newPlan, name: newPlanName };
              plans?.push(editPlanName);
            } else {
              let editPlanName = {
                ...newPlan,
                name: newPlan?.name?.trim() + "-entries-" + newPlan?.entries,
              };
              plans?.push(editPlanName);
            }
          } else {
            plans?.push(item);
          }
        });
        setPlanDetail({ ...planDetail, plans: plans });
        setNewPlan({
          name: "",
          entries: 1,
          purchaseType: "month",
          mincycle: 1,
          price: "",
          exclusiveDraw: false,
        });
      }
    }
  };

  const handleBack = () => {
    shopify.loading(true);
    setTableSkel(true);
    navigate("/app/plans");
  };
  return (
    <>
      {tableSkel ? (
        <TableSkeleton />
      ) : contentSkel ? (
        <ContentSkeleton />
      ) : (
        <Page
          backAction={{ content: "", onAction: handleBack }}
          title={
            id == "create"
              ? "Create raffle"
              : "Update raffle"
          }
          primaryAction={
            <Button loading={btnLoader} onClick={handleSavePlan}>
              {id == "create" ? "Save raffle" : "Update raffle"}
            </Button>
          }
        >
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
              <BlockStack gap="300">
                <Card>
                  <BlockStack gap="200">
                    <TextField
                      label="Name"
                      value={planDetail?.name}
                      onChange={(value) => handleChange(value, "name")}
                      autoComplete="off"
                    />

                    <Checkbox
                      label="Want to update plan after one month ?"
                      checked={planDetail?.sellingPlanUpdate}
                      onChange={(value) =>
                        handleChange(value, "sellingPlanUpdate")
                      }
                    />
                  </BlockStack>
                  {planDetail?.sellingPlanUpdate && (
                    <Box>
                      <InlineStack align="space-between">
                        <Select
                          label="Upgrade to"
                          options={upgradeOptions}
                          value={planDetail?.upgradeTo || "bronze"}
                          onChange={(value) => handleChange(value, "upgradeTo")}
                        />
                        <TextField
                          label="Future entries would be?"
                          type="number"
                          value={planDetail?.futureEntries || 5}
                          onChange={(value) =>
                            handleChange(value, "futureEntries")
                          }
                          autoComplete="off"
                        />
                      </InlineStack>
                    </Box>
                  )}
                </Card>
                <Card>
                  <Grid>
                    <Grid.Cell
                      columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
                      style={{ display: "flex", alignItems: "flex-end" }}
                    >
                      <ChoiceList
                        title="Is this a capped giveaway or time-limt giveaway ?"
                        choices={[
                          { label: "Capped", value: "capped" },
                          { label: "Time-limit", value: "time-limit" },
                        ]}
                        selected={planDetail?.raffleType || "capped"}
                        onChange={(value) => handleChange(value, "raffleType")}
                      />
                    </Grid.Cell>
                    {planDetail?.raffleType == "time-limit" ? (
                      <>
                        <Grid.Cell
                          columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}
                          style={{ display: "flex", alignItems: "flex-end" }}
                        >
                          <Text as="h2" variant="headingSm">
                            Select Time Period
                          </Text>
                        </Grid.Cell>

                        <Grid.Cell
                          columnSpan={{ xs: 6, sm: 6, md: 8, lg: 8, xl: 8 }}
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          {planDetail?.offerValidity && (
                            <DateRangePicker
                              setPlanDetail={setPlanDetail}
                              planDetail={planDetail}
                            />
                          )}
                        </Grid.Cell>
                      </>
                    ) : (
                      <>
                        {" "}
                        <Grid.Cell
                          columnSpan={{ xs: 9, sm: 9, md: 9, lg: 9, xl: 9 }}
                          style={{ display: "flex", alignItems: "flex-end" }}
                        >
                          <Text as="h2" variant="headingSm">
                            How much spots per person can have?
                          </Text>
                        </Grid.Cell>
                        <Grid.Cell
                          columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}
                        >
                          <TextField
                            label="How much spots per person can have?"
                            type="number"
                            labelHidden
                            value={planDetail?.spots || 1}
                            onChange={(value) => handleChange(value, "spots")}
                            autoComplete="off"
                            align="right"
                          />
                        </Grid.Cell>
                        <Grid.Cell
                          columnSpan={{
                            xs: 12,
                            sm: 12,
                            md: 12,
                            lg: 12,
                            xl: 12,
                          }}
                          style={{ display: "flex", alignItems: "flex-end" }}
                        >
                          <Text as="h2" variant="headingSm">
                            Note: Manage your spots through inventory and update
                            it accordingly. Ignore if already managed.
                          </Text>
                        </Grid.Cell>
                      </>
                    )}
                  </Grid>
                </Card>
                <Card>
                  <Grid>
                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 9, lg: 9, xl: 9 }}
                    >
                      <Text as="h2" variant="headingSm">
                        Products
                      </Text>
                    </Grid.Cell>
                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}
                    >
                      <Box paddingBlockStart="200">
                        <Button onClick={handleResourcePicker}>
                          Add Product
                        </Button>
                      </Box>
                    </Grid.Cell>
                  </Grid>
                  <ResourceList
                    resourceName={{ singular: "prduct", plural: "products" }}
                    items={planDetail?.products}
                    renderItem={(item) => {
                      const { product_id, product_image, product_name } = item;
                      const media = (
                        <Avatar
                          customer
                          size="md"
                          name={product_name}
                          source={product_image}
                        />
                      );
                      const shortcutActions = [
                        {
                          content: <Icon source={DeleteIcon} />,
                          accessibilityLabel: <Icon source={DeleteIcon} />,
                          onAction: () => handleDeleteProduct(product_id),
                        },
                      ];
                      return (
                        <ResourceItem
                          id={product_id}
                          url={product_image}
                          media={media}
                          accessibilityLabel={`View details for ${product_name}`}
                          shortcutActions={shortcutActions}
                          persistActions
                        >
                          <Text variant="bodyMd" fontWeight="bold" as="h3">
                            {product_name}
                          </Text>
                        </ResourceItem>
                      );
                    }}
                  />
                </Card>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
              <BlockStack gap="200">
                <Card>
                  <Text>Add Your Tickets</Text>
                  <BlockStack gap="300">
                    <Grid>
                      <Grid.Cell
                        columnSpan={{ xs: 6, sm: 6, md: 9, lg: 6, xl: 6 }}
                      >
                        <TextField
                          label="Name"
                          placeholder="Enter your ticket name"
                          value={newPlan?.name?.split("-entries-")?.[0]}
                          onChange={(value) =>
                            handleModalValChange(value, "name")
                          }
                          autoComplete="off"
                        />
                      </Grid.Cell>
                      <Grid.Cell
                        columnSpan={{ xs: 6, sm: 6, md: 9, lg: 3, xl: 3 }}
                      >
                        <TextField
                          label="Price"
                          type="number"
                          value={newPlan?.price}
                          onChange={(value) =>
                            handleModalValChange(value, "price")
                          }
                          prefix="$"
                          autoComplete="off"
                        />
                      </Grid.Cell>
                      <Grid.Cell
                        columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}
                      >
                        <TextField
                          label="Entries"
                          type="number"
                          value={newPlan?.entries}
                          onChange={(value) =>
                            handleModalValChange(value, "entries")
                          }
                          autoComplete="off"
                        />
                      </Grid.Cell>
                      <Grid.Cell
                        columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}
                        gap="600"
                      >
                        <Select
                          label="Purchase type"
                          options={options}
                          value={newPlan?.purchaseType}
                          onChange={(value) =>
                            handleModalValChange(value, "purchaseType")
                          }
                        />
                        {existPlanType && (
                          <Text tone="critical">Ticket already exists.</Text>
                        )}
                      </Grid.Cell>
                      <Grid.Cell
                        columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}
                        gap="600"
                      >
                        <TextField
                          label="Minimum cycle"
                          type="number"
                          disabled={newPlan?.purchaseType == "day"}
                          value={newPlan?.mincycle}
                          onChange={(value) =>
                            handleModalValChange(value, "mincycle")
                          }
                          autoComplete="off"
                          min={1}
                        />
                        {minCycleErr && (
                          <Text tone="critical">
                            Value should be greater than or equal to 1.
                          </Text>
                        )}
                      </Grid.Cell>
                    </Grid>
                    <Button
                      onClick={
                        editSellingPlan ? handleUpdatePlan : handleAddPlan
                      }
                    >
                      {editSellingPlan ? "Update" : "Add"} Ticket
                    </Button>
                    <ResourceList
                      resourceName={{ singular: "plan", plural: "plans" }}
                      items={planDetail?.plans}
                      renderItem={(item, index) => {
                        const { purchaseType, entries, name } = item;
                        const shortcutActions = [
                          {
                            content: <Icon source={EditIcon} />,
                            accessibilityLabel: <Icon source={EditIcon} />,
                            onAction: () => {
                              setEditSellingPlan(true);
                              setExistPlanType(false);
                              setPlanNameExist(false);
                              setMinCycleErr(false);
                              setNewPlan({ ...item });
                              setUpdatePlanIndex(index);
                            },
                          },
                          {
                            content: <Icon source={DeleteIcon} />,
                            accessibilityLabel: <Icon source={DeleteIcon} />,
                            onAction: () => {
                              setSellingPlanModal(true);
                              setDeleteSellingPlan(item);
                            },
                          },
                        ];
                        return (
                          <ResourceItem
                            key={index}
                            accessibilityLabel={`View details for ${name}`}
                            shortcutActions={shortcutActions}
                            persistActions
                          >
                            <InlineStack gap={400}>
                              <Text variant="bodyMd" fontWeight="bold" as="p">
                                {name.split("-entries-")?.[0]}
                              </Text>
                              <Text variant="bodyMd" fontWeight="bold" as="p">
                                {entries} entries
                              </Text>
                              <Text variant="bodyMd" fontWeight="bold" as="p">
                                {purchaseType == "day"
                                  ? "One-time"
                                  : `${purchaseType}ly`}
                              </Text>
                            </InlineStack>
                          </ResourceItem>
                        );
                      }}
                    />
                  </BlockStack>
                </Card>
                <Card>
                    <Checkbox
                      label="Visible on customer Portal"
                      checked={planDetail?.showOnPortal}
                      onChange={(value) =>
                        handleChange(value, "showOnPortal")
                      }
                    />
                </Card>
              </BlockStack>
            </Grid.Cell>
          </Grid>

          <div className="sd-ultimate-option-AlertModal">
            <Modal
              open={sellingPlanModal}
              onClose={() => {
                setSellingPlanModal(false), setDeleteSellingPlan("");
              }}
              title={"Delete Selling Plan?"}
              primaryAction={{
                content: "Delete",
                onAction: () => {
                  setSellingPlanModal(false);
                  if (deleteSellingPlan) {
                    if (deleteSellingPlan?.plan_id) {
                      let arr = deletePlans;
                      arr.push(deleteSellingPlan);
                      setDeletePlans(arr);
                    }
                    if (planDetail?.plans?.length > 0) {
                      let data = planDetail.plans.filter(
                        (plan) => plan?.name !== deleteSellingPlan?.name,
                      );
                      setPlanDetail({ ...planDetail, plans: data });
                    }
                  }
                },
              }}
              secondaryActions={[
                {
                  content: "Cancel",
                  onAction: () => {
                    setSellingPlanModal(false);
                    setDeleteSellingPlan("");
                  },
                },
              ]}
            >
              <Modal.Section>
                <BlockStack gap={5}>
                  <p>
                    Are you sure you want to delete this selling plan? This
                    can't be restored.
                  </p>
                </BlockStack>
              </Modal.Section>
            </Modal>
            {/* <div style={{ height: "250px" }}>
              <Popover
                active={sellingPlanModal}
                // activator={activator}
                autofocusTarget="first-node"
                onClose={() => {
                    setSellingPlanModal(false), setDeleteSellingPlan("");
                  }}
              >
                <Popover.Pane fixed>
                  <Popover.Section>
                    <p>Available sales channels</p>
                  </Popover.Section>
                </Popover.Pane>
                <Popover.Pane>
                  <ActionList
                    actionRole="menuitem"
                    items={[
                      { content: "Online store" },
                      { content: "Facebook" },
                      { content: "Shopify POS" },
                    ]}
                  />
                </Popover.Pane>
              </Popover>
            </div> */}
          </div>
        </Page>
      )}
    </>
  );
}
