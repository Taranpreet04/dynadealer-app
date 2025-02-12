import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit, useNavigate, useParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { checkProductSubscription, createPlan, getPlanById, updatePlanById } from "../controllers/planController";
import { authenticate } from "../shopify.server";
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons"
import { Button, Page, Card, ResourceList, Avatar, ResourceItem, Text, Icon, TextField, BlockStack, Grid, Select, Modal, Box, Checkbox, InlineStack, DatePicker } from "@shopify/polaris";
import planStyles from '../styles/planCreate.css?url';
import TableSkeleton from "../components/tableSkeleton";
import ContentSkeleton from "../components/contentSkeleton";
import DateRangePicker from "../components/datePicking";

export const links = () => [
    { rel: "stylesheet", href: planStyles }
];
export const loader = async ({ params, request }) => {
    const { admin } = await authenticate.admin(request);
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
        futureEntries: formData.get("futureEntries"),
        products: JSON.parse(formData.get("products")),
        plans: JSON.parse(formData.get("plans")),
        offerValidity: offerValidity
    };
console.log(newPlanDetails)
    try {
        let detail = { updatePlans, deletePlans, newPlans, dbProducts }
        let planDetails = { success: false, error: "Product has already subscription plans" }
        // let hasSubscription = await checkProductSubscription(newPlanDetails, params?.id)
        // console.log("hasSubscription=", hasSubscription)
        // if (!hasSubscription) {
            if (params?.id == "create") {
                planDetails = await createPlan(admin, newPlanDetails)
            } else {
                planDetails = await updatePlanById(admin, { id: params?.id, plan_group_id: plan_group_id }, newPlanDetails, detail);
            }
        // }

        return json(planDetails);
    } catch (error) {
        console.error("Error creating plan details:", error);
        return json({ success: false, error: "Failed to create plan details......in action" });
    }
};


export default function CreateUpdatePlan() {
    const loaderData = useLoaderData();
    const submit = useSubmit();
    const actionData = useActionData()
    const navigate = useNavigate();
    let { id } = useParams()
    const [sellingPlanModal, setSellingPlanModal] = useState(false)
    const [deleteSellingPlan, setDeleteSellingPlan] = useState('')
    const [existPlanType, setExistPlanType] = useState(false)
    const [minCycleErr, setMinCycleErr] = useState(false)
    const [planNameExist, setPlanNameExist] = useState(false)
    const [editSellingPlan, setEditSellingPlan] = useState(false)
    const [deletePlans, setDeletePlans] = useState([])
    const [dbProducts, setDbProducts] = useState([])
    const [tableSkel, setTableSkel] = useState(false);
    const [contentSkel, setContentSkel] = useState(false);
    const [btnLoader, setBtnLoader] = useState(false);
    const [updatePlanIndex, setUpdatePlanIndex] = useState(-1);
    const [newPlan, setNewPlan] = useState({
        name: 'New plan',
        entries: 1,
        purchaseType: 'day',
        mincycle: 1,
        price: '',
        exclusiveDraw: false
    })
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const resetToMidnight = (date) => {
        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0);
        return newDate;
    };
    const [planDetail, setPlanDetail] = useState({
        name: '',
        sellingPlanUpdate: false,
        upgradeTo: 'bronze',
        futureEntries: 5,
        plans: [],
        products: [],
    })
    const [originalData, setOriginalData] = useState({
        name: '',
        plans: [],
        products: []
    })


    useEffect(() => {
        shopify.loading(true)
        const toIST = (dateString) => {
            const date = new Date(dateString);
            const offsetInMinutes = 330;
            return new Date(date.getTime() - offsetInMinutes * 60 * 1000);
        };
        if (loaderData !== null) {
            const dates = {
                start: new Date(toIST(loaderData?.offerValidity?.start)),
                end: new Date(toIST(loaderData?.offerValidity?.end))
            }
            setPlanDetail({ ...loaderData, offerValidity: dates })
            setOriginalData({ ...loaderData, offerValidity: dates })
            setDbProducts([...loaderData?.products])
        } else {
            setPlanDetail({
                ...planDetail, offerValidity: {
                    start: resetToMidnight(new Date()),
                    end: resetToMidnight(new Date((new Date()).getTime() + 10 * 24 * 60 * 60 * 1000)),
                }
            })
        }
        shopify.loading(false)
    }, [loaderData])

    const handleSavePlan = () => {
        console.log("planDetail====", planDetail)
        let oneTimePlanExist=false
        planDetail?.plans?.map((plan)=>{
            if(plan?.purchaseType=='day'){
                oneTimePlanExist= true
            }
        })
        if (planDetail?.name.trim() == '') {
            shopify.toast.show("Name is required.", { duration: 5000 })
        } else if (planDetail?.plans?.length <= 0) {
            shopify.toast.show("Minimum one selling plan is required.", { duration: 5000 })
        } else if (planDetail?.products?.length <= 0) {
            shopify.toast.show("Minimum one product is required.", { duration: 5000 })
        } else if(planDetail?.sellingPlanUpdate && oneTimePlanExist){
            shopify.toast.show("Please remove the one-time plan, as you intend to upgrade it next month.", { duration: 5000 })
        }else {
            let newPlans = []
            let updatePlans = []
            planDetail?.plans?.map((item) => {
                item?.plan_id ? updatePlans?.push(item) : newPlans?.push(item)
            })
            if (JSON.stringify(originalData) !== JSON.stringify(planDetail)) {
                let formData = {
                    ...planDetail,
                    plans: JSON.stringify(planDetail?.plans),
                    products: JSON.stringify(planDetail?.products),
                    newPlans: JSON.stringify(newPlans),
                    updatePlans: JSON.stringify(updatePlans),
                    deletePlans: JSON.stringify(deletePlans),
                    dbProducts: JSON.stringify(dbProducts),
                    offerValidity: JSON.stringify(planDetail?.offerValidity)
                }
                console.log("formData====", formData)
                shopify.loading(true)
                setBtnLoader(true)
                submit(formData, {
                    method: "post",
                })
            } else {
                shopify.toast.show("No Changes Found", { duration: 5000 })
            }
        }
    }


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
            multiple: true, selectionIds: ids
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
            setPlanDetail({ ...planDetail, products: sendData })
        }
    }

    useEffect(() => {
        if (actionData?.success) {
            id == "create" ?
                shopify.toast.show("Plan successfully created.", { duration: 5000 }) :
                shopify.toast.show("Plan successfully updated.", { duration: 5000 });
            setBtnLoader(false)
            setTableSkel(true)
            navigate('../plans')
        } else if (actionData?.success == false) {
            shopify.toast.show(`${actionData?.error}`, { duration: 5000 })
            shopify.loading(false)
            setBtnLoader(false)
        }
        shopify.loading(false)
    }, [actionData])

    const options = [
        { label: 'One-time', value: 'day' },
        { label: 'Weekly', value: 'week' },
        { label: 'Monthly', value: 'month' },
        { label: 'Yearly', value: 'year' },
    ];
    const upgradeOptions = [
        { label: 'Bronze', value: 'bronze' },
        { label: 'Silver', value: 'silver' },
        { label: 'Gold', value: 'gold' },
        { label: 'Platinum', value: 'platinum' },
    ];

    const handleModalValChange = (val, name) => {
        let match = 0
        let planName = newPlan?.name
        if (name == "name") {
            planDetail?.plans?.map((item) => {
                if (item?.name.trim() == val.trim() && !editSellingPlan) {
                    match = 1
                }
            })
        }
        if (match == 1) {
            match = 0
            setPlanNameExist(true)
        } else {
            setPlanNameExist(false)
        }


        if (newPlan?.purchaseType !== "day" && name == "mincycle" && val <= 0) {
            setMinCycleErr(true)
        } else if (newPlan?.mincycle <= 0) {
            setMinCycleErr(true)
        } else {
            setMinCycleErr(false)
        }

        // if (name == "entries") {
        //     planName = newPlan?.name?.split('-entries-')[0] + '-entries-' + val
        // }
        if (val == 'day') {
            setNewPlan({
                ...newPlan,
                [name]: name === 'price' ? (val ? parseFloat(val) : '') : val,
                mincycle: 1,
                // name: name === 'entries' ? planName : newPlan?.name
            })
        } else {
            setNewPlan({
                ...newPlan,
                [name]: name === 'price' ? (val ? parseFloat(val) : '') : val,
                // name: name === 'entries' ? planName : newPlan?.name
            })
        }
    }


    const handleChange = (val, name) => {
        setPlanDetail({
            ...planDetail,
            [name]: val
        })
    }
    const handleDeleteProduct = (id) => {
        let products = planDetail?.products?.filter((item) => item?.product_id !== id)
        setPlanDetail({ ...planDetail, products: products })
    }


    const handleAddPlan = () => {
        if (editSellingPlan) {
            let plans = [];
            let nameExist = 0
            planDetail?.plans?.map(item => {
                if (item?.name.trim() == newPlan?.name.trim()) {
                    nameExist = nameExist + 1;
                    setPlanNameExist(true)
                }
            })
            if (planNameExist || nameExist > 1) {
                shopify.toast.show("Plan name should be unique", { duration: 5000 })
            } else if ((minCycleErr || !(newPlan?.mincycle >= 1) && newPlan?.purchaseType !== "day")) {
                setMinCycleErr(true)
                shopify.toast.show("Minimum cycle should be greater than or equal to 1.", { duration: 5000 })
            } else if (newPlan?.price == '' || parseInt(newPlan?.price) <= 0) {
                shopify.toast.show("Price is required", { duration: 5000 })
            } else {
                setEditSellingPlan(false)
                planDetail?.plans?.map((item, index) => {
                    if (index == updatePlanIndex) {
                        if (newPlan?.name?.includes('-entries-')) {
                            let newPlanName = newPlan?.name.split('-entries-')[0] + '-entries-' + newPlan?.entries
                            let editPlanName = { ...newPlan, name: newPlanName }
                            plans?.push(editPlanName)
                        } else {
                            let editPlanName = { ...newPlan, name: newPlan?.name + "-entries-" + newPlan?.entries }
                            plans?.push(editPlanName)
                        }

                    } else {
                        plans?.push(item)
                    }
                })
                console.log("plans==", plans)
                setPlanDetail({ ...planDetail, plans: plans })
                setNewPlan({
                    name: 'New plan',
                    entries: 1,
                    purchaseType: 'day',
                    mincycle: 1,
                    price: '',
                    exclusiveDraw: false
                })
            }
        } else {
            let match = 0;
            let nameExist = 0
            planDetail?.plans?.map((item) => {
                if (item?.name == newPlan?.name) {
                    nameExist = 1
                    setPlanNameExist(true)
                }
            })

            if (planNameExist || nameExist > 0) {
                shopify.toast.show("Plan name should be unique", { duration: 5000 })
            } else if (existPlanType || match > 0) {
                shopify.toast.show("Plan already exist.", { duration: 5000 })
            } else if ((minCycleErr || !(newPlan?.mincycle >= 1) && newPlan?.purchaseType !== "day")) {
                shopify.toast.show("Minimum cycle should be greater than or equal to 1.", { duration: 5000 })
            } else if (newPlan?.price == '' || parseInt(newPlan?.price) <= 0) {
                shopify.toast.show("Price is required", { duration: 5000 })
            } else {
                setEditSellingPlan(false)
                let editPlanName = { ...newPlan, name: newPlan?.name + "-entries-" + newPlan?.entries }
                let newPlans = [...planDetail?.plans, editPlanName]
                setPlanDetail({ ...planDetail, plans: newPlans })
                setNewPlan({
                    name: 'New plan',
                    entries: 1,
                    purchaseType: 'day',
                    mincycle: 1,
                    price: '',
                    exclusiveDraw: false
                })
            }
        }
    }
    return (
        <>
            {tableSkel ? <TableSkeleton /> :
                contentSkel ? <ContentSkeleton /> :
                    <Page
                        backAction={{
                            content: '', url: '../plans', onAction: () => {
                                shopify.loading(true)
                                setTableSkel(true)
                            }
                        }}
                        title={id == "create" ? "Create subscription plan" : "Update subscription plan"}
                        primaryAction={<Button loading={btnLoader} onClick={handleSavePlan}>{(id == "create") ? "Save plan" : "Update plan"}</Button>}
                    >
                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                                <BlockStack gap="300">
                                    <Card>
                                       <BlockStack gap='200'>
                                       <TextField
                                            label="Name"
                                            value={planDetail?.name}
                                            onChange={(value) => handleChange(value, 'name')}
                                            autoComplete="off"
                                        />

                                        <Checkbox
                                            label="Want to update plan after one month ?"
                                            checked={planDetail?.sellingPlanUpdate}
                                            onChange={(value) => handleChange(value, 'sellingPlanUpdate')}
                                        // onChange={handleChange}
                                        />
                                       </BlockStack>
                                        {planDetail?.sellingPlanUpdate &&
                                            <Box>
                                                <InlineStack align="space-between">
                                                    <Select
                                                        label="Upgrade to"
                                                        options={upgradeOptions}
                                                        value={planDetail?.upgradeTo}
                                                        onChange={(value) => handleChange(value, 'upgradeTo')}
                                                    />
                                                    <TextField
                                                        label="Future entries would be?"
                                                        type="number"
                                                        value={planDetail?.futureEntries}
                                                        onChange={(value) => handleChange(value, 'futureEntries')}
                                                        autoComplete="off"
                                                    />
                                                </InlineStack>
                                            </Box>

                                        }
                                    </Card>
                                    <Card>
                                        <Grid>
                                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}
                                                style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                <Text as="h2" variant="headingSm" >
                                                    Select Time Period
                                                </Text>
                                            </Grid.Cell>
                                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 8, lg: 8, xl: 8 }}
                                                style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                {planDetail?.offerValidity &&
                                                    <DateRangePicker
                                                        setPlanDetail={setPlanDetail}
                                                        planDetail={planDetail}
                                                    />
                                                }
                                            </Grid.Cell>
                                        </Grid>
                                    </Card>
                                    <Card>
                                        <Grid>
                                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 9, lg: 9, xl: 9 }}>
                                                <Text as="h2" variant="headingSm">
                                                    Products
                                                </Text>
                                            </Grid.Cell>
                                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
                                                <Box paddingBlockStart="200">
                                                    <Button onClick={handleResourcePicker}>Add Product</Button>
                                                </Box>
                                            </Grid.Cell>
                                        </Grid>
                                        <ResourceList
                                            resourceName={{ singular: 'prduct', plural: 'products' }}
                                            items={planDetail?.products}
                                            renderItem={(item) => {
                                                const { product_id, product_image, product_name } = item;
                                                const media = <Avatar customer size="md" name={product_name} source={product_image} />;
                                                const shortcutActions = [
                                                    {
                                                        content: <Icon source={DeleteIcon} />,
                                                        accessibilityLabel: <Icon source={DeleteIcon} />,
                                                        onAction: () => handleDeleteProduct(product_id)
                                                    },
                                                ]
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
                                        <Text>Add Your Plans</Text>
                                        <BlockStack gap='300'>
                                            <Grid>
                                                <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 9, lg: 6, xl: 6 }}>
                                                    <TextField
                                                        label="Name"
                                                        value={newPlan?.name?.split("-entries-")?.[0]}
                                                        onChange={(value) => handleModalValChange(value, 'name')}
                                                        autoComplete="off"
                                                    />
                                                </Grid.Cell>
                                                <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 9, lg: 3, xl: 3 }}>
                                                    <TextField
                                                        label="Price"
                                                        type="number"
                                                        value={newPlan?.price}
                                                        onChange={(value) => handleModalValChange(value, 'price')}
                                                        prefix="$"
                                                        autoComplete="off"
                                                    />
                                                </Grid.Cell>
                                                <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
                                                    <TextField
                                                        label="Entries"
                                                        type="number"
                                                        value={newPlan?.entries}
                                                        onChange={(value) => handleModalValChange(value, 'entries')}
                                                        autoComplete="off"
                                                    />
                                                </Grid.Cell>
                                                <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }} gap="600">
                                                    <Select
                                                        label="Purchase type"
                                                        options={options}
                                                        value={newPlan?.purchaseType}
                                                        onChange={(value) => handleModalValChange(value, 'purchaseType')}
                                                    />
                                                    {existPlanType &&
                                                        <Text tone="critical">Plan already exists.</Text>
                                                    }
                                                </Grid.Cell>
                                                <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }} gap="600">
                                                    <TextField
                                                        label="Minimum cycle"
                                                        type="number"
                                                        disabled={newPlan?.purchaseType == "day"}
                                                        value={newPlan?.mincycle}
                                                        onChange={(value) => handleModalValChange(value, 'mincycle')}
                                                        autoComplete="off"
                                                        min={1}
                                                    />
                                                    {minCycleErr &&
                                                        <Text tone="critical">Value should be greater than or equal to 1.</Text>
                                                    }
                                                </Grid.Cell>
                                            </Grid>
                                            <Button onClick={handleAddPlan}>{editSellingPlan ? "Update" : "Add"} plan</Button>
                                            <ResourceList
                                                resourceName={{ singular: 'plan', plural: 'plans' }}
                                                items={planDetail?.plans}
                                                renderItem={(item, index) => {
                                                    const { purchaseType, entries, name } = item;
                                                    const shortcutActions = [
                                                        {
                                                            content: <Icon source={EditIcon} />,
                                                            accessibilityLabel: <Icon source={EditIcon} />,
                                                            onAction: () => {
                                                                setEditSellingPlan(true)
                                                                setExistPlanType(false)
                                                                setPlanNameExist(false)
                                                                setMinCycleErr(false)
                                                                setNewPlan({ ...item })
                                                                setUpdatePlanIndex(index)
                                                            }
                                                        },
                                                        {
                                                            content: <Icon source={DeleteIcon} />,
                                                            accessibilityLabel: <Icon source={DeleteIcon} />,
                                                            onAction: () => {
                                                                setSellingPlanModal(true)
                                                                setDeleteSellingPlan(item)
                                                            }
                                                        },
                                                    ]
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
                                                                    {purchaseType == 'day' ? 'One-time' : `${purchaseType}ly`}
                                                                </Text>
                                                            </InlineStack>
                                                        </ResourceItem>
                                                    );
                                                }}
                                            />
                                        </BlockStack>
                                    </Card>
                                </BlockStack>
                            </Grid.Cell>
                        </Grid>

                        <div className="sd-ultimate-option-AlertModal">
                            <Modal
                                open={sellingPlanModal}
                                onClose={() => { setSellingPlanModal(false), setDeleteSellingPlan('') }}
                                title={"Delete Selling Plan?"}
                                primaryAction={{
                                    content: "Delete",
                                    onAction: () => {
                                        setSellingPlanModal(false)
                                        if (deleteSellingPlan) {
                                            if (deleteSellingPlan?.plan_id) {
                                                let arr = deletePlans
                                                arr.push(deleteSellingPlan)
                                                setDeletePlans(arr)
                                            }
                                            if (planDetail?.plans?.length > 0) {
                                                let data = planDetail.plans.filter(plan => plan?.name !== deleteSellingPlan?.name);
                                                setPlanDetail({ ...planDetail, plans: data });
                                            }
                                        }
                                    },
                                }}
                                secondaryActions={[
                                    {
                                        content: "Cancel",
                                        onAction: () => {
                                            setSellingPlanModal(false)
                                            setDeleteSellingPlan('')
                                        },
                                    },
                                ]}
                            >
                                <Modal.Section>
                                    <BlockStack gap={5}>
                                        <p>
                                            Are you sure you want to delete this selling plan? This can't
                                            be restored.
                                        </p>
                                    </BlockStack>
                                </Modal.Section>
                            </Modal>
                        </div>
                        {/* <div className="sd-ultimate-option-AlertModal">
                            <Modal
                                open={showDatePicker}
                                onClose={() => { setShowDatePicker(false) }}
                                title={"Select Date Range"}
                                primaryAction={{
                                    content: "Ok",
                                    onAction: () => {
                                        setShowDatePicker(false)
                                        // let formData = {
                                        //     products: JSON.stringify(products),
                                        //     selectedDates: JSON.stringify(selectedDates)
                                        // }
                                        // submit(formData, {
                                        //     method: "post",
                                        // })
                                    },
                                }}
                                secondaryActions={[
                                    {
                                        content: "Cancel",
                                        onAction: () => {
                                            setShowDatePicker(false)
                                        },
                                    },
                                ]}
                            >
                                <Modal.Section>
                                   <BlockStack gap={5}>
                                        <DatePicker
                                            month={month}
                                            year={year}
                                            onChange={setSelectedDates}
                                            onMonthChange={handleMonthChange}
                                            selected={selectedDates}
                                            multiMonth
                                            allowRange
                                        />
                                    </BlockStack> 
                                   
                                </Modal.Section>
                            </Modal>
                        </div> */}
                    </Page>
            }
        </>
    );
}
