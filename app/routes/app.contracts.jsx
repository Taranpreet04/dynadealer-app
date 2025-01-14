import { json, useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { Page, Filters, ChoiceList, Modal, BlockStack, DatePicker, Button, Text, Icon, DataTable, Badge, Card, Link, SkeletonDisplayText, TextField, EmptyState, SkeletonBodyText } from "@shopify/polaris";
import React, { useState, useEffect } from "react";
import { useLocation } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getAllSubscriptions, getExportData } from "../controllers/planController";
import TableSkeleton from "../components/tableSkeleton";
import ContentSkeleton from "../components/contentSkeleton";
import xlsx from "json-as-xlsx"
// import { sendEmail } from "../controllers/mail";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || '';
  const page = url.searchParams.get("page") || 1;
  const planDetails = await getAllSubscriptions(admin, page, search);
  if (planDetails?.status == 200) {
    return json({ planDetails: planDetails })
  }
  return json({ planDetails: planDetails })
}

export default function ContractData() {
  const loaderData = useLoaderData();
  const actionData = useActionData()
  const submit = useSubmit();
  const location = useLocation();
  const [tableData, setTableData] = useState([])
  const [products, setProducts] = useState([])
  const [searchValue, setSearchValue] = useState('');
  const [totaldocs, setTotaldocs] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [tableSkel, setTableSkel] = useState(false);
  const [contentSkel, setContentSkel] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const [{ month, year }, setDate] = useState({ month: currentMonth - 1, year: currentYear });
  const resetToMidnight = (date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };
  const [selectedDates, setSelectedDates] = useState({
    start: resetToMidnight(new Date((new Date()).getTime() - 10 * 24 * 60 * 60 * 1000)), // Ten days before, reset to midnight
    end: resetToMidnight(new Date()), // Today, reset to midnight
  });

  const handleMonthChange = (month, year) => {
    setDate({ month, year })
  }
  useEffect(() => {
    shopify.loading(true)
    setTableSkel(true)
    loaderData?.planDetails ? setTableData(loaderData?.planDetails?.details) : ''
    let total = loaderData?.planDetails.total;
    setTotalRows(loaderData?.planDetails.total)
    let docs = parseInt(total / 10);
    if ((total % 10) > 0) {
      docs = docs + 1;
    }
    setTotaldocs(docs)
    shopify.loading(false)
    setTableSkel(false)
  }, [loaderData])

  useEffect(() => {
    const url = new URL(window.location.origin + location.pathname + location.search);
    const search = url.searchParams.get("search") || '';
    const page = url.searchParams.get("page") || 1;
    setPage(page)
    setSearchValue(search)
  }, [])

  useEffect(() => {
    if (actionData?.status) {
      let detail = actionData?.data
      let dataToExport=[]
       detail?.map((detail)=>{
          detail?.drawIds?.map((id) =>{
            dataToExport.push({
              drawId: id,
              customerId: detail?.customerId,
              customerName: detail?.customerName,
              orderId: detail?.orderId
            })
          })
      })
      if (dataToExport?.length > 0) {
        let data = [
          {
            sheet: "tickets",
            columns: [
              { label: "Public info (username)", value: "customerName" },
              { label: "Private info", value: "customerId" },
              { label: "Order ID", value: "orderId" },
              { label: "Draw ID", value: "drawId" },
            ],
            content: dataToExport
          },
        ]
        let settings = {
          fileName: "MyTickets", 
          extraLength: 3, 
          writeMode: "writeFile", 
          writeOptions: {}, 
          RTL: false, 
        }
        xlsx(data, settings) 
      } else {
        shopify.toast.show("No data found", { duration: 5000 })
      }
    }
    shopify.loading(false)
    setTableSkel(false)
  }, [actionData])

  const rows = tableData?.map((itm, index) => [
    <Text>{itm?.contractId}</Text>,
    <Text> {itm?.customerName}</Text>,
    <Text><Badge tone={(itm?.status == "CANCELLED") ? 'critical' : 'success'}>{itm?.status}</Badge></Text>,
    <Text as="p">
      <Link url={`/app/contract/${itm?.contractId}`} prefetch="viewport" onClick={() => { shopify.loading(true), setContentSkel(true) }}>
        <svg class="eye-svg w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="black" stroke-width="1" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z" />
          <path stroke="black" stroke-width="1" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg></Link>
    </Text>
  ])


  const handleNextPage = () => {
    shopify.loading(true)
    setTableSkel(true)
    setPage(page + 1);
    const params = new URLSearchParams();
    params.set("search", searchValue);
    params.set("page", page + 1);
    submit(params, {
      method: "get"
    })
  };

  const handlePrevPage = () => {
    shopify.loading(true)
    setTableSkel(true)
    setPage(page - 1);
    const params = new URLSearchParams();
    params.set("search", searchValue);
    params.set("page", page - 1);
    submit(params, {
      method: "get"
    })
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
      setProducts(sendData)
      setShowDatePicker(true)

    }
  }

  return (
    <>
      {tableSkel ?
        <TableSkeleton /> :
        contentSkel ? <ContentSkeleton /> :
          <Page
            title="Contracts"
            primaryAction={<Button variant="primary"
              onClick={() => handleResourcePicker()}
            >Export</Button>}
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
                        Contract Id
                      </Text>,
                      <Text variant="headingSm" as="h6">
                        {" "}
                        Customer Name
                      </Text>,
                      <Text variant="headingSm" as="h6">
                        {" "}
                        Status
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
                onClose={() => { setShowDatePicker(false) }}
                title={"Select Date Range"}
                primaryAction={{
                  content: "filter",
                  onAction: () => {
                    setShowDatePicker(false)
                    let formData = {
                      products: JSON.stringify(products),
                      selectedDates: JSON.stringify(selectedDates)
                    }
                    submit(formData, {
                      method: "post",
                    })
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
            </div>
          </Page>
      }
    </>
  )
}

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const data = Object.fromEntries(formData);
  let products = JSON.parse(data.products)
  let date = JSON.parse(data.selectedDates)
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
}
