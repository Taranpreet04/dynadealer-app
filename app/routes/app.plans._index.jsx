import { json, useActionData, useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import {
  Page, InlineStack,
  Text, Icon,
  DataTable, Modal,
  Button, BlockStack,
  Card, EmptyState,
} from "@shopify/polaris";
import React, { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { EditIcon, DeleteIcon } from "@shopify/polaris-icons"
import { getAllPlans, deletePlanById } from "../controllers/planController";
import TableSkeleton from "../components/tableSkeleton";
import ContentSkeleton from "../components/contentSkeleton";


export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  const planDetails = await getAllPlans(admin);
  return json(planDetails)
}

export default function PlanData() {
  const loaderData = useLoaderData();
  const actionData = useActionData()
  const submit = useSubmit();
  const navigate = useNavigate();
  const [data, setData] = useState([])
  const [tableData, setTableData] = useState([])
  const [totaldocs, setTotaldocs] = useState(0);
  const [skip, setSkip] = useState(0)
  const [limit, setLimit] = useState(10)
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [reCheck, setReCheck] = useState(false)
  const [deleteId, setDeleteId] = useState([])
  const [tableSkel, setTableSkel] = useState(false);
  const [contentSkel, setContentSkel] = useState(false);

  useEffect(() => {
    shopify.loading(true)
    setTableSkel(true)
    loaderData?.planDetails ? setData(loaderData?.planDetails) : ''
    let table = loaderData?.planDetails?.slice(skip, limit)
    setTableData(table)
    let total = loaderData?.planDetails.length;
    setTotalRows(loaderData?.planDetails.length)
    let docs = parseInt(total / limit);
    if ((total % limit) > 0) {
      docs = docs + 1;
    }
    setTotaldocs(docs)
    shopify.loading(false)
    setTableSkel(false)
  }, [loaderData])

  useEffect(() => {
    actionData?.status ? shopify.toast.show("Plan deleted", { duration: 5000 }) : ''
    shopify.loading(false)
    setTableSkel(false)
  }, [actionData])


  const rows = tableData?.map(({ _id, name, products, plans }, index) => [
    <Text>{name}</Text>,
    <Text>{products?.length} products</Text>,

    <Text> {plans?.length} subscription option</Text>,
    <InlineStack as="span">
      <span onClick={() => {
        setContentSkel(true)
        navigate(`/app/plans/${_id}`);
      }} >
        <Icon source={EditIcon} />
      </span>
      <span onClick={() => {
        setReCheck(true);
        setDeleteId(_id);
      }} >
        <Icon source={DeleteIcon} />
      </span>
    </InlineStack>
  ])

  const handleReCheckClose = () => {
    setReCheck(false);
    setDeleteId("");
  };

  let plan = tableData?.filter((item) => item?._id == deleteId)
  const deletePlan = (deleteId) => {
    let data = {
      _id: deleteId,
      plan_group_id: plan[0]?.plan_group_id
    }
    shopify.loading(true)
    setTableSkel(true)
    submit(data, {
      method: "post"
    })
  }
  useEffect(() => {
    if (data.length > 0) {
      let table = data?.slice(skip, skip + limit)
      setTableData(table)
      tableSkel(false)
    }
  }, [skip])

  const handleNextPage = () => {
    tableSkel(true)
    setPage(page + 1);
    if (page >= 1) {
      setSkip((page) * limit)
    } else {
      setSkip(0)
    }
  };


  const handlePrevPage = () => {
    tableSkel(true)
    setPage(page - 1);
    if ((page - 1) > 1) {
      let skip = (page - 1) * limit
      setSkip(skip)
    } else {
      setSkip(0)
    }
  };
  return (
    <>
      {tableSkel ?
        <TableSkeleton /> :
        contentSkel ? <ContentSkeleton /> :
          <Page title="Plans" primaryAction={<Button variant="primary" onClick={() => {
            navigate("/app/plans/create")
            setContentSkel(true)
          }
          }>Create new</Button>}>
            <Card>
              {tableData.length > 0 ? (
                <>
                  <div className="home-section">
                    <Card>
                      <DataTable
                        hasZebraStripingOnData
                        hoverable
                        stickyHeader
                        columnContentTypes={["text", "text", "text", "text"]}
                        headings={[
                          <Text variant="headingSm" as="h6">
                            Plan name
                          </Text>,
                          <Text variant="headingSm" as="h6">
                            {" "}
                            Products
                          </Text>,
                          <Text variant="headingSm" as="h6">
                            {" "}
                            Subscription options
                          </Text>,
                          <Text variant="headingSm" alignment="center" as="h6">
                            {" "}
                            Actions
                          </Text>,
                        ]}
                        rows={rows}
                        verticalAlign="middle"
                        footerContent={`Showing ${page} of ${totaldocs} page`}
                        pagination={{
                          hasNext: totaldocs <= page ? false : true,
                          hasPrevious: page == 1 ? false : true,
                          onNext: () => {
                            handleNextPage();
                          },
                          onPrevious: () => {
                            handlePrevPage();
                          },
                        }}
                      />
                    </Card>

                  </div>
                  <div className="sd-ultimate-option-AlertModal">
                    <Modal
                      open={reCheck}
                      onClose={handleReCheckClose}
                      title={"Delete Plan?"}
                      primaryAction={{
                        content: "Delete",
                        onAction: () => {
                          setReCheck(false)
                          deletePlan(deleteId);
                        },
                      }}
                      secondaryActions={[
                        {
                          content: "Cancel",
                          onAction: () => {
                            setReCheck(false);
                            setDeleteId("");
                          },
                        },
                      ]}
                    >
                      <Modal.Section>
                        <BlockStack gap={5}>
                          <p>
                            Are you sure you want to delete this subscription plan? This can't
                            be restored.
                          </p>
                        </BlockStack>
                      </Modal.Section>
                    </Modal>
                  </div>
                </>
              ) : (
                <Card>
                  <EmptyState
                    heading="Let's create your first subscription plan."
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  ></EmptyState>
                </Card>
              )}
            </Card>
          </Page>
      }
    </>
  )
}

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const data = Object.fromEntries(formData);

  try {
    const res = await deletePlanById(admin, data);
    return json(res);
  } catch (error) {
    console.error("Error occur in delete plan details:", error);
    return json({ success: false, error: "Failed to delete plan details." });
  }
}