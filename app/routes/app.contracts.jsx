import {
  json,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import {
  Page,
  Modal,
  BlockStack,
  DatePicker,
  Button,
  Text,
  Icon,
  DataTable,
  Badge,
  Card,
  Link,
  EmptyState,
} from "@shopify/polaris";
import React, { useState, useEffect } from "react";
import { useLocation } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getSubscriptions, getExportData , } from "../controllers/planController";
import TableSkeleton from "../components/tableSkeleton";
import ContentSkeleton from "../components/contentSkeleton";
import xlsx from "json-as-xlsx";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = url.searchParams.get("page") || 1;
  const planDetails = await getSubscriptions(admin, page, search);
  if (planDetails?.status == 200) {
    return json({ planDetails: planDetails });
  }
  return json({ planDetails: planDetails });
};

export default function ContractData() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const location = useLocation();
  const [tableData, setTableData] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [totaldocs, setTotaldocs] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [tableSkel, setTableSkel] = useState(false);
  const [contentSkel, setContentSkel] = useState(false);
  const [products, setProducts] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const [{ month, year }, setDate] = useState({
    month: currentMonth == 0 ? 11 : currentMonth - 1,
    year: currentMonth == 0 ? currentYear - 1 : currentYear,
  });
  const resetToMidnight = (date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };
  const [selectedDates, setSelectedDates] = useState({
    start: resetToMidnight(
      new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000),
    ), // Ten days before, reset to midnight
    end: resetToMidnight(new Date()), // Today, reset to midnight
  });

  const handleMonthChange = (month, year) => {
    setDate({ month, year });
  };
  useEffect(() => {
    let limit=50
    shopify.loading(true);
    setTableSkel(true);
    loaderData?.planDetails
      ? setTableData(loaderData?.planDetails?.details)
      : "";
    let total = loaderData?.planDetails.total;
    setTotalRows(loaderData?.planDetails.total);
    let docs = parseInt(total / limit);
    if (total % limit > 0) {
      docs = docs + 1;
    }
    setTotaldocs(docs);
    shopify.loading(false);
    setTableSkel(false);
  }, [loaderData]);

  useEffect(() => {
    const url = new URL(
      window.location.origin + location.pathname + location.search,
    );
    const search = url.searchParams.get("search") || "";
    const page = url.searchParams.get("page") || 1;
    setPage(page);
    setSearchValue(search);
  }, []);

  useEffect(() => {
    if (actionData?.status) {
      let detail = actionData?.data;

      let dataToExport = [];

      detail.map((detail) => {
        detail?.appliedForDetail[0]?.appliedList.map((data) => {
          dataToExport.push({
            drawId: data,
            customerId: detail?.customerId,
            customerName: detail?.customerName,
            customerEmail: detail?.customerEmail,
            customerPhone: detail?.customerPhone,
            orderHashId: detail?.orderHashId,
            orderId: detail?.orderId,
          });
        });
      });
      console.log("dataToExport==", dataToExport)
      if (dataToExport?.length > 0) {
        let data = [
          {
            sheet: "tickets",
            columns: [
              { label: "Customer Id", value: "customerId" },
              { label: "Order ID", value: "orderHashId" },
              { label: "Customer Name", value: "customerName" },
              { label: "Email", value: "customerEmail" },
              { label: "Phone", value: "customerPhone" },
              { label: "Draw ID", value: "drawId" },
            ],
            content: dataToExport,
          },
        ];
        let settings = {
          fileName: "MyTickets",
          extraLength: 3,
          writeMode: "writeFile",
          writeOptions: {},
          RTL: false,
        };
        xlsx(data, settings);
      } else {
        shopify.toast.show("No data found", { duration: 5000 });
      }
    }
    shopify.loading(false);
    setTableSkel(false);
  }, [actionData]);
  const toIST = (dateString) => {
    const date = new Date(dateString);
    const offsetInMinutes = 330;
    return new Date(date.getTime() - offsetInMinutes * 60 * 1000);
  };
  function formatISOToDate(isoDate) {
    const date = new Date(isoDate);
    return date.toISOString().split("T")[0]; // Extracts YYYY-MM-DD
  }
  const rows = tableData?.map((itm, index) => [
    <Text>{itm?.orderId}</Text>,
    <Text alignment="center"> {itm?.customerName}</Text>,
    <Text alignment="center"> {itm?.ticketDetails?.total}</Text>,
    <Text alignment="center"> {itm?.ticketDetails?.applied}</Text>,
    <Text alignment="center"> {itm?.ticketDetails?.available}</Text>,
    <Text alignment="center">
      <Badge tone={itm?.status == "CANCELLED" ? "critical" : "success"}>
        {itm?.status}
      </Badge>
    </Text>,
    <Text alignment="center"> {formatISOToDate(toIST(itm?.createdAt))}</Text>,
    <Text as="p" alignment="center">
      <Link
        url={`/app/contract/${itm?._id}`}
        prefetch="viewport"
        onClick={() => {
          shopify.loading(true), setContentSkel(true);
        }}
      >
        <svg
          className="eye-svg w-6 h-6 text-gray-800 dark:text-white"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke="black"
            strokeWidth="1"
            d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"
          />
          <path
            stroke="black"
            strokeWidth="1"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      </Link>
    </Text>,
  ]);

  const handleNextPage = () => {
    shopify.loading(true);
    setTableSkel(true);
    setPage(Number(page) + 1);
    const params = new URLSearchParams();
    params.set("search", searchValue);
    params.set("page", Number(page) + 1);
    submit(params, {
      method: "get",
    });
  };

  const handlePrevPage = () => {
    shopify.loading(true);
    setTableSkel(true);
    setPage(Number(page) - 1);
    const params = new URLSearchParams();
    params.set("search", searchValue);
    params.set("page", Number(page) - 1);
    submit(params, {
      method: "get",
    });
  };

  const handleResourcePicker = async () => {
    const productPickerData = await shopify.resourcePicker({
      type: "product",
      filter: {
        draft: false,
        variants: false,
      },
    });
    let sendData = [];
    if (productPickerData !== undefined) {
      productPickerData?.map((item) => {
        let p_id = item.id;
        sendData.push(p_id);
      });
      setProducts(sendData);
      setShowDatePicker(true);
    }
  };

  return (
    <>
      {tableSkel ? (
        <TableSkeleton />
      ) : contentSkel ? (
        <ContentSkeleton />
      ) : (
        <Page
          // fullWidth
          title="Subscribers"
          primaryAction={
            <Button
              variant="primary"
              disabled={tableData?.length <= 0}
              onClick={() => handleResourcePicker()}
            >
              Export
            </Button>
          }
        >
          <Card>
            {tableData.length > 0 ? (
              <Card>
                <DataTable
                  hasZebraStripingOnData
                  hoverable
                  stickyHeader
                  columnContentTypes={["text", "text", "text", "text"]}
                  headings={[
                    <Text variant="headingSm" as="h6">
                      Order Id
                    </Text>,
                    <Text variant="headingSm" as="h6" alignment="center">
                      {" "}
                      Customer Name
                    </Text>,
                    <Text variant="headingSm" as="h6" alignment="center">
                      {" "}
                      Total Tickets
                    </Text>,
                    <Text variant="headingSm" as="h6" alignment="center">
                      {" "}
                      Applied tickets
                    </Text>,
                    <Text variant="headingSm" as="h6" alignment="center">
                      {" "}
                      Available Tickets
                    </Text>,
                    <Text variant="headingSm" as="h6" alignment="center">
                      {" "}
                      Status
                    </Text>,
                    <Text variant="headingSm" as="h6" alignment="center">
                      {" "}
                      Created At
                    </Text>,
                    <Text variant="headingSm" alignment="center" as="h6">
                      {" "}
                      Actions
                    </Text>,
                  ]}
                  rows={rows}
                  verticalAlign="middle"
                  footerContent={`page = ${page} | Showing ${rows.length} of ${totalRows} results`}
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
            ) : (
              <Card>
                <EmptyState
                  heading="Let's create your first subscription plan."
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                ></EmptyState>
              </Card>
            )}
          </Card>

          <div className="sd-ultimate-option-AlertModal">
            <Modal
              open={showDatePicker}
              onClose={() => {
                setShowDatePicker(false);
              }}
              title={"Select Date Range"}
              primaryAction={{
                content: "filter",
                onAction: () => {
                  setShowDatePicker(false);
                  let formData = {
                    products: JSON.stringify(products),
                    selectedDates: JSON.stringify(selectedDates),
                  };
                  submit(formData, {
                    method: "post",
                  });
                },
              }}
              secondaryActions={[
                {
                  content: "Cancel",
                  onAction: () => {
                    setShowDatePicker(false);
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
  let products = JSON.parse(data.products);
  let date = JSON.parse(data.selectedDates);
  try {
    const res = await getExportData(admin, products, date);
    if (res?.success) {
      return json({ status: true, data: res?.data });
    } else {
      return json({ status: false, data: [] });
    }
  } catch (error) {
    console.error("Error occur in delete plan details:", error);
    return json({ success: false, error: "Failed to delete plan details." });
  }
};
