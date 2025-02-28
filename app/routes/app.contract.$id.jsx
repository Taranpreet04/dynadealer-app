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
} from "../controllers/planController";
import TableSkeleton from "../components/tableSkeleton";

export const loader = async ({ params, request }) => {
  const { admin } = await authenticate.admin(request);
  const res = await getConstractDetailById(admin, params?.id);

  return json({ data: res?.data });
};

export default function ContractDetails() {
  const loaderData = useLoaderData();
  const submit = useSubmit();
  const params = useParams();
  const actionData = useActionData();
  const [tableData, setTableData] = useState([]);
  const [data, setData] = useState();
  const [loading, setLoading] = useState(true);
  const [reCheck, setReCheck] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [btnLoader, setBtnLoader] = useState(false);

  useEffect(() => {
    shopify.loading(true);
    setLoading(true);
    loaderData?.data ? setData(loaderData?.data) : "";
    let products = [];
    loaderData?.data?.lines?.edges.map((itm) => {
      products.push(itm?.node);
    });
    setCurrency(products[0]?.currentPrice?.currencyCode);
    setTableData(products);
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
    <Text>
      <img src={itm?.variantImage?.url} height={50} width={50} />
    </Text>,
    <Text> {itm?.title} </Text>,
    <Text> ${itm?.currentPrice.amount} </Text>,
    <Text>
      {" "}
      {itm?.sellingPlanName?.split("-entries-")?.[1] || 1 * itm?.quantity}{" "}
    </Text>,
    <Text> ${itm?.currentPrice.amount} </Text>,
  ]);

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
            data?.status !== "CANCELLED" ? (
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
                      {capitalizeFirstLetter(data?.customer?.firstName)}{" "}
                      {capitalizeFirstLetter(data?.customer?.lastName)}
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
                      {data?.billingPolicy?.interval == "DAY"
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
                      {data?.billingPolicy?.minCycles}
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
                <Text variant="headingSm" as="h6">
                  Image
                </Text>,
                <Text variant="headingSm" as="h6">
                  Product Name
                </Text>,
                <Text variant="headingSm" as="h6">
                  {" "}
                  Price ({currency})
                </Text>,
                <Text variant="headingSm" as="h6">
                  {" "}
                  Entries
                </Text>,
                <Text variant="headingSm" alignment="center" as="h6">
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
