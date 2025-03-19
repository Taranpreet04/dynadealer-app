import {
  Page,
  DataTable,
  Modal,
  Card,
  Text,
  Box,
  Grid,
  Badge,
  BlockStack,
  SkeletonDisplayText,
  SkeletonBodyText,
  Button,
} from "@shopify/polaris";
import {
  useActionData,
  useLoaderData,
  useParams,
  useSubmit,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useEffect, useState } from "react";
import {
  cancelContract,
  getConstractDetailById,getSpecificContract
} from "../controllers/planController";
import TableSkeleton from "../components/tableSkeleton";

export const loader = async ({ params, request }) => {
  const { admin } = await authenticate.admin(request);
  let res
  if(params?.id?.length> 15){
    res= await getSpecificContract(admin, params?.id)
  }else{
    res = await getConstractDetailById(admin, params?.id);
  }

  return json({ data: res?.data, id: params?.id });
};

export default function ContractDetails() {
  const loaderData = useLoaderData();
  const submit = useSubmit();
  const params = useParams();
  const actionData = useActionData();
  const [tableData, setTableData] = useState([]);
  const [data, setData] = useState();
  const [dbData, setDbData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reCheck, setReCheck] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [btnLoader, setBtnLoader] = useState(false);

  useEffect(() => {
    shopify.loading(true);
    setLoading(true);
    console.log("loaderData?.data==", loaderData?.data)
  if(loaderData?.id?.length>15){
    
    setDbData(true)
    setCurrency('USD')
    loaderData?.data ? setData(loaderData?.data) : "";
    setTableData(loaderData?.data?.products)
  }else{ 
    setDbData(false)
    loaderData?.data ? setData(loaderData?.data) : "";
    let products = [];
    loaderData?.data?.lines?.edges.map((itm) => {
      products.push(itm?.node);
    });
    setCurrency(products[0]?.currentPrice?.currencyCode);
    console.log("products--", products)
    setTableData(products);
  }
   
    shopify.loading(false);
    setLoading(false);
  }, [loaderData]);

  useEffect(() => {
    setBtnLoader(false);
    if (actionData?.message == "success") {
      shopify.toast.show("Contract cancel successfully.", { duration: 5000 });
    }
    if (actionData?.message == "failed") {
      shopify.toast.show("Fail to cancel contract.", { duration: 5000 });
    }
  }, [actionData]);
  const rows = tableData?.map((itm, index) => [
    // <Text>
    //   <img src={itm?.variantImage?.url} height={50} width={50} />
    // </Text>,
    <Text> {itm?.title || itm?.productName} </Text>,
    <Text alignment="center"> ${itm?.currentPrice?.amount || itm?.price} </Text>,
    <Text alignment="center">
      {" "}
      {itm?.sellingPlanName?.split("-entries-")?.[1] || itm?.entries}{" "}
    </Text>,
    <Text alignment="end"> ${itm?.currentPrice?.amount || itm?.price} </Text>,
  ]);

  function capitalizeFirstLetter(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }


  console.log("data==", data)
  console.log("db--data==", dbData)
  return (
    <>
      {loading ? (
        <TableSkeleton />
      ) : (
        <Page
          title="Back to Listing"
          backAction={{
            content: "",
            url: "../contracts",
            onAction: () => {
              shopify.loading(true), setLoading(true);
            },
          }}
          primaryAction={
            !(data?.status == "CANCELLED"|| data?.status == "ONETIME") ? (
              <Button
                primary
                loading={btnLoader}
                onClick={() => {
                  setReCheck(true);
                }}
              >
                Cancel
              </Button>
            ) : null
          }
        >
          <Card>
            <div className="contract-header">
              <Badge
                tone={
                  data?.status == "ACTIVE" ||
                  data?.billingPolicy?.interval == "DAY"
                    ? "success"
                    : "critical"
                }
              >
                {data?.billingPolicy?.interval == "DAY"
                  ? "ONETIME"
                  : data?.status}
              </Badge>
            </div>
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4, xl: 4 }}>
                <Card>
                  <Text as="h2" variant="headingSm">
                    Customer Name
                  </Text>
                  <Box paddingBlockStart="200">
                    <Text as="p" variant="bodyMd">
                      {dbData ?
                      <>{capitalizeFirstLetter(data?.customerName)}</> :
                      <>{capitalizeFirstLetter(data?.customer?.firstName)}{" "}
                      {capitalizeFirstLetter(data?.customer?.lastName)}</>
                      }
                      
                    </Text>
                  </Box>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4, xl: 4 }}>
                <Card>
                  <Text as="h2" variant="headingSm">
                    Billing Frequency
                  </Text>
                  <Box paddingBlockStart="200">
                    <Text as="p" variant="bodyMd">
                      {dbData ?
                      data?.billing_policy?.interval
                       :data?.billingPolicy?.interval == "DAY"
                        ? "ONETIME"
                        : data?.billingPolicy?.interval}
                    </Text>
                  </Box>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4, xl: 4 }}>
                <Card>
                  <Text as="h2" variant="headingSm">
                    Minimum Billing cycles
                  </Text>
                  <Box paddingBlockStart="200">
                    <Text as="p" variant="bodyMd">
                      {dbData? data?.billing_policy?.min_cycles :data?.billingPolicy?.minCycles}
                    </Text>
                  </Box>
                </Card>
              </Grid.Cell>
            </Grid>
          </Card>
          <Box paddingBlockStart={300}>
            <DataTable
              hasZebraStripingOnData
              hoverable
              stickyHeader
              columnContentTypes={["text", "text", "text", "text"]}
              headings={[
                // <Text variant="headingSm" as="h6">
                //   Image
                // </Text>,
                <Text variant="headingSm" as="h6">
                  Product Name
                </Text>,
                <Text variant="headingSm" as="h6" alignment="center">
                  {" "}
                  Price ({currency})
                </Text>,
                <Text variant="headingSm" as="h6" alignment="center">
                  {" "}
                  Entries
                </Text>,
                <Text variant="headingSm" alignment="end" as="h6">
                  {" "}
                  Total ({currency})
                </Text>,
              ]}
              rows={rows}
              verticalAlign="middle"
            />
          </Box>
          <div className="sd-ultimate-option-AlertModal">
            <Modal
              open={reCheck}
              onClose={() => setReCheck(false)}
              title={"Cancel contract?"}
              primaryAction={{
                content: "Yes",
                onAction: () => {
                  setReCheck(false);
                  setBtnLoader(true);
                  let formData = {
                    ...data,
                    status: "CANCELLED",
                    contractDbID: params?.id,
                  };
                  submit(formData, {
                    method: "post",
                  });
                },
              }}
              secondaryActions={[
                {
                  content: "No",
                  onAction: () => {
                    setReCheck(false);
                  },
                },
              ]}
            >
              <Modal.Section>
                <BlockStack gap={5}>
                  <p>
                    Are you sure you want to cancel this contract? This can't be
                    restored.
                  </p>
                </BlockStack>
              </Modal.Section>
            </Modal>
          </div>
        </Page>
      )}
    </>
  );
}

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const res = await cancelContract(admin, data);
  if (res.success) {
    return json({ message: "success", data: res?.data });
  } else {
    return json({ message: "failed", data: res?.data });
  }
};
