import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit, useNavigate, useParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { createPlan, getPlanById, updatePlanById } from "../controllers/planController";
import { authenticate } from "../shopify.server";
import { PlusCircleIcon, DeleteIcon, EditIcon } from "@shopify/polaris-icons"
import { Button, Page, Card, ResourceList, Avatar, ResourceItem, Text, Icon, TextField, BlockStack, Grid, Listbox, Select, Modal, Box, Checkbox, InlineStack } from "@shopify/polaris";
import planStyles from '../styles/planCreate.css?url';
import TableSkeleton from "../components/tableSkeleton";
import ContentSkeleton from "../components/contentSkeleton";

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

    const newPlanDetails = {
        shop: shop,
        name: formData.get("name"),
        products: JSON.parse(formData.get("products")),
        plans: JSON.parse(formData.get("plans")),
    };

    try {
        let detail = { updatePlans, deletePlans, newPlans, dbProducts }
        const planDetails = params?.id == "create" ?
            await createPlan(admin, newPlanDetails) :
            await updatePlanById(admin, { id: params?.id, plan_group_id: plan_group_id }, newPlanDetails, detail);
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
    const [addPlanModal, setAddPlanModal] = useState(false)
    const [sellingPlanModal, setSellingPlanModal] = useState(false)
    const [deleteSellingPlan, setDeleteSellingPlan] = useState('')
    const [existPlanType, setExistPlanType] = useState(false)
    const [minCycleErr, setMinCycleErr] = useState(false)
    const [priceErr, setPriceErr] = useState(false)
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
        purchaseType: 'year',
        mincycle: 1,
        price: '',
        exclusiveDraw: false
    })
    const [planDetail, setPlanDetail] = useState({
        name: '',
        plans: [],
        products: []
    })
    const [originalData, setOriginalData] = useState({
        name: '',
        plans: [],
        products: []
    })

    useEffect(() => {
        shopify.loading(true)
        if (loaderData !== null) {
            setPlanDetail({ ...loaderData })
            setOriginalData({ ...loaderData })
            setDbProducts([...loaderData?.products])
        }
        shopify.loading(false)
    }, [loaderData])

    const handleSavePlan = () => {
        if (planDetail?.name.trim() == '') {
            shopify.toast.show("Name is required.", { duration: 5000 })
        } else if (planDetail?.plans?.length <= 0) {
            shopify.toast.show("Minimum one selling plan is required.", { duration: 5000 })
        } else if (planDetail?.products?.length <= 0) {
            shopify.toast.show("Minimum one product is required.", { duration: 5000 })
        } else {
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
                }
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
        }
        shopify.loading(false)
    }, [actionData])

    const options = [
        // { label: 'Oneday-testing', value: 'day' },
        { label: 'One-time', value: 'year' },
        // { label: 'Weekly', value: 'week' },
        { label: 'Monthly', value: 'month' },
    ];

    const handleModalValChange = (val, name) => {
        let match = 0
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


        if (newPlan?.purchaseType !== "year" && name == "mincycle" && val <= 0) {
            setMinCycleErr(true)
        } else if (newPlan?.mincycle <= 0) {
            setMinCycleErr(true)
        } else {
            setMinCycleErr(false)
        }

        if (val == 'year') {
            setNewPlan({
                ...newPlan,
                [name]: name === 'price' ? (val ? parseFloat(val) : '') : val,
                mincycle: 1
            })
        } else {
            setNewPlan({
                ...newPlan,
                [name]: name === 'price' ? (val ? parseFloat(val) : '') : val,
            })
        }
    }


    const handleChange = (val, name) => {
        setPlanDetail({
            ...planDetail,
            [name]: val
        })
    }

    const handleModalClose = () => {
        setEditSellingPlan(false)
        setAddPlanModal(false);
        setExistPlanType(false)
        setPlanNameExist(false)
        setMinCycleErr(false)
        setNewPlan({
            name: 'New plan',
            entries: 1,
            purchaseType: 'year',
            mincycle: 1,
            price: '',
            exclusiveDraw: false
        })
    };

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
            } else if ((minCycleErr || !(newPlan?.mincycle >= 1) && newPlan?.purchaseType !== "year")) {
                setMinCycleErr(true)
                shopify.toast.show("Minimum cycle should be greater than or equal to 1.", { duration: 5000 })
            } else if (newPlan?.price == '' || parseInt(newPlan?.price) <= 0) {
                setPriceErr(true)
                shopify.toast.show("Price is required", { duration: 5000 })
            } else {
                setAddPlanModal(false)
                setEditSellingPlan(false)
                planDetail?.plans?.map((item, index) => {
                    if (index == updatePlanIndex) {
                        if (newPlan?.name?.includes('-entries-')) {
                            plans?.push(newPlan)
                        } else {
                            let editPlanName = { ...newPlan, name: newPlan?.name + "-entries-" + newPlan?.entries }
                            plans?.push(editPlanName)
                        }

                    } else {
                        plans?.push(item)
                    }
                })
                setPlanDetail({ ...planDetail, plans: plans })
                setNewPlan({
                    name: 'New plan',
                    entries: 1,
                    purchaseType: 'year',
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
            } else if ((minCycleErr || !(newPlan?.mincycle >= 1) && newPlan?.purchaseType !== "year")) {
                shopify.toast.show("Minimum cycle should be greater than or equal to 1.", { duration: 5000 })
            } else if (newPlan?.price == '' || parseInt(newPlan?.price) <= 0) {
                setPriceErr(true)
                shopify.toast.show("Price is required", { duration: 5000 })
            } else {
                setPriceErr(false)
                setAddPlanModal(false)
                setEditSellingPlan(false)
                let editPlanName = { ...newPlan, name: newPlan?.name + "-entries-" + newPlan?.entries }
                let newPlans = [...planDetail?.plans, editPlanName]
                setPlanDetail({ ...planDetail, plans: newPlans })
                setNewPlan({
                    name: 'New plan',
                    entries: 1,
                    purchaseType: 'year',
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
                                <BlockStack gap="200">
                                    <Card>
                                        <TextField
                                            label="Name"
                                            value={planDetail?.name}
                                            onChange={(value) => handleChange(value, 'name')}
                                            autoComplete="off"
                                        />
                                    </Card>
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
                                                        disabled={newPlan?.purchaseType == "year"}
                                                        value={newPlan?.mincycle}
                                                        onChange={(value) => handleModalValChange(value, 'mincycle')}
                                                        autoComplete="off"
                                                        min={1}
                                                    />
                                                    {minCycleErr &&
                                                        <Text tone="critical">Value should be greater than or equal to 1.</Text>
                                                    }
                                                </Grid.Cell>
                                                {newPlan?.purchaseType !== "year" ?
                                                    <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }} gap="800">
                                                        <Text>Add exclusive draw</Text>
                                                        <Checkbox
                                                            label=" "
                                                            checked={newPlan?.exclusiveDraw}
                                                            onChange={(value) => handleModalValChange(value, 'exclusiveDraw')}
                                                        />
                                                    </Grid.Cell> : ''
                                                }
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
                                                            <InlineStack gap={600}>
                                                                <Text variant="bodyMd" fontWeight="bold" as="h3">
                                                                    {name.split("-entries-")?.[0]}
                                                                </Text>
                                                                <Text variant="bodyMd" fontWeight="bold" as="h3">
                                                                    {entries} entries
                                                                </Text>
                                                                <Text variant="bodyMd" fontWeight="bold" as="h3">
                                                                    {purchaseType == 'year' ? 'One-time' : purchaseType == 'day' ? 'Daily' : `${purchaseType}ly`}
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
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
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
                    </Page>
            }
        </>
    );
}
