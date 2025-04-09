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
  getConstractDetailById,
  getSpecificContract,
} from "../controllers/planController";
import TableSkeleton from "../components/tableSkeleton";

export const loader = async ({ params, request }) => {
  const { admin } = await authenticate.admin(request);
  let res;
  // if (params?.id?.length > 15) {
  //   res = await getSpecificContract(admin, params?.id);
  // } else {
  res = await getConstractDetailById(admin, params?.id);
  // }

  return json({ ...res, id: params?.id });
};

export default function ContractDetails() {
  const loaderData = useLoaderData();
  const submit = useSubmit();
  const params = useParams();
  const actionData = useActionData();
  const [tableData, setTableData] = useState([]);
  const [shopifyData, setShopifyData] = useState();
  const [dbDetails, setDbDetails] = useState();
  const [oneTimeContract, setOneTimeContract] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reCheck, setReCheck] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [btnLoader, setBtnLoader] = useState(false);

  useEffect(() => {
    shopify.loading(true);
    setLoading(true);
    let products = [];
    if (loaderData?.shopifyData) {
      setOneTimeContract(false);
      loaderData?.shopifyData ? setShopifyData(loaderData?.shopifyData) : "";
      loaderData?.dbDetails ? setDbDetails(loaderData?.dbDetails) : "";
      loaderData?.shopifyData?.lines?.edges.map((itm) => {
        products.push(itm?.node);
      });
      setCurrency(products[0]?.currentPrice?.currencyCode);
      setTableData(products);
    } else {
      setOneTimeContract(true);
      setCurrency("USD");
      loaderData?.dbDetails ? setDbDetails(loaderData?.dbDetails) : "";
      setTableData(loaderData?.dbDetails?.products);
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
  const rows = tableData?.map((itm) => [
    <Text> {itm?.title || itm?.productName} </Text>,
    <Text alignment="center">
      {" "}
      {oneTimeContract
        ? itm?.currentPrice?.amount || itm?.price
        : itm?.currentPrice?.amount || itm?.price}
    </Text>,
    <Text alignment="center">
      {" "}
      {itm?.sellingPlanName?.split("-entries-")?.[1] || itm?.entries}{" "}
    </Text>,
    <Text alignment="end"> ${itm?.currentPrice?.amount || itm?.price} </Text>,
  ]);
  const rowsTicket = [
    [
      <Text>Applied </Text>,
      <Text alignment="center"> {dbDetails?.ticketDetails?.applied} </Text>,
      <Text alignment="end">
        {dbDetails?.ticketDetails?.appliedTicketsList?.join(", ")}
      </Text>,
    ],
    [
      <Text>Available </Text>,
      <Text alignment="center"> {dbDetails?.ticketDetails?.available} </Text>,
      <Text alignment="end">
        {dbDetails?.ticketDetails?.availableTicketsList?.join(",")}
      </Text>,
    ],
    [
      <Text>Total </Text>,
      <Text alignment="center">{dbDetails?.ticketDetails?.total} </Text>,
      <Text alignment="end">
        {dbDetails?.ticketDetails?.totalTicketsList?.join(",")}
      </Text>,
    ],
  ];

  function capitalizeFirstLetter(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

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
            !(
              dbDetails?.status == "CANCELLED" || dbDetails?.status == "ONETIME"
            ) ? (
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
                  dbDetails?.status == "ACTIVE" ||
                  dbDetails?.billingPolicy?.interval == "DAY"
                    ? "success"
                    : "critical"
                }
              >
                {dbDetails?.billingPolicy?.interval == "DAY"
                  ? "ONETIME"
                  : dbDetails?.status}
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
                      {oneTimeContract ? (
                        <>{capitalizeFirstLetter(dbDetails?.customerName)}</>
                      ) : (
                        <>
                          {capitalizeFirstLetter(
                            shopifyData?.customer?.firstName,
                          )}{" "}
                          {capitalizeFirstLetter(
                            shopifyData?.customer?.lastName,
                          )}
                        </>
                      )}
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
                      {oneTimeContract
                        ? dbDetails?.billing_policy?.interval
                        : shopifyData?.billingPolicy?.interval == "DAY"
                          ? "ONETIME"
                          : shopifyData?.billingPolicy?.interval}
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
                      {oneTimeContract
                        ? dbDetails?.billing_policy?.min_cycles
                        : shopifyData?.billingPolicy?.minCycles}
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
          <Box paddingBlockStart={300}>
            {/* {oneTimeContract ? ( */}
            <DataTable
              hasZebraStripingOnData
              hoverable
              stickyHeader
              columnContentTypes={["text", "text", "text"]}
              headings={[
                <Text variant="headingSm" as="h6"></Text>,
                <Text variant="headingSm" as="h6" alignment="center">
                  Tickets
                </Text>,
                <Text variant="headingSm" as="h6" alignment="center">
                  Details
                </Text>,
              ]}
              rows={rowsTicket}
              verticalAlign="middle"
            />
            {/* ) : (
              ""
            )} */}
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
                    ...shopifyData,
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
