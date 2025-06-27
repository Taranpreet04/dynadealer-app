import { useActionData, useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
// import { ResourcePicker } from "@shopify/app-bridge-react";
import { getSalesOverTime, getSubscriptionStats, getTotalRevenue, getSubscribersStats } from "../controllers/planController";
import TableSkeleton from "../components/tableSkeleton";
import {
  Button,
  Page,
  Card,
  EmptyState,
  IndexTable,
  Link,
  EmptySearchResult,
  InlineStack,
  Icon,
  useIndexResourceState,
  Text,
  Box,
  DataTable,
  Modal,
  BlockStack,
  Spinner,
  TextField,
  Grid,
  ChoiceList,
  DatePicker,
  Select,
  InlineGrid,
} from "@shopify/polaris";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { useEffect, useState } from "react";
import { DeleteIcon, ChartHistogramGrowthIcon, XCircleIcon, StatusActiveIcon, MoneyIcon } from "@shopify/polaris-icons";

import React from "react";

import { Knob } from "../components/knob";


// const data = Array.from({ length: 30 }, (_, i) => {
//   const date = new Date(2025, 5, i + 1); // June = month 5
//   return {
//     date: (i + 1).toString(), // format: YYYY-MM-DD
//     sales: Math.floor(Math.random() * 200) + 50, // random sales between 50-250
//   };
// });



export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  console.log("shop in loader ===>", session.shop);
  const today = new Date();
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(today.getDate() - 30);
  const startDate = tenDaysAgo.toISOString().split("T")[0]; // "2025-06-03"
  const endDate = today.toISOString().split("T")[0];

  const salesData = await getSalesOverTime(session.shop, startDate, endDate);
  const stats = await getSubscriptionStats(session.shop);
  const totalRevenue = await getTotalRevenue(session.shop);
  const totalSubscribers = await getSubscribersStats(session.shop);
  return { salesData, stats, totalRevenue, totalSubscribers };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const body = await request.formData();

  return null
};
export default function Index() {

  const [selectedProduct, setSelectedProduct] = useState("all");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { salesData, stats, totalRevenue, totalSubscribers } = useLoaderData();
  console.log("salesData ===>", salesData);
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

  const filteredData = salesData?.filter((item) => {
    const itemDate = new Date(item.date); // assuming item.date = "2025-06-10"
    itemDate.setHours(0, 0, 0, 0);
    const start = new Date(selectedDates.start);
    const end = new Date(selectedDates.end);
    return itemDate >= start && itemDate <= end;
  });

  const handleMonthChange = (month, year) => {
    setDate({ month, year });
  };

  console.log("selectedDataes==>", selectedDates)

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
  const formatDate = (date) =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const selectedDateLabel = `${formatDate(selectedDates.start)} - ${formatDate(selectedDates.end)}`;

  const calculateChange = (curr, prev) => {
    if (!prev || prev === 0) return "-";
    const change = ((curr - prev) / prev) * 100;
    return `${change.toFixed(1)}%`;
  };
  const rows = [
    [
      'Total Subscribers',
      totalSubscribers.current?.toString(),
      totalSubscribers.previous?.toString(),
      totalSubscribers.change === "-" ? "-" : (
        <span style={{
          color: parseFloat(totalSubscribers.change) > 0 ? "green" : "red",
          fontWeight: "bold"
        }}>
          {parseFloat(totalSubscribers.change) > 0 ? "↑" : "↓"} {totalSubscribers.change}
        </span>
      ),
    ],
    ['New Subscribers', totalSubscribers.newSubscribers.toString(), '-', '-'],
    [
      "Canceled Subscribers",
      totalSubscribers.cancelledSubscribers.current.toString(),
      totalSubscribers.cancelledSubscribers.previous.toString(),
      totalSubscribers.change === "-" ? "-" : (
        <span style={{
          color: parseFloat(totalSubscribers.change) > 0 ? "green" : "red",
          fontWeight: "bold"
        }}>
          {parseFloat(totalSubscribers.change) > 0 ? "↑" : "↓"} {totalSubscribers.change}
        </span>
      ),
    ],
    [
  'Net Subscriber Growth',
  totalSubscribers.netSubscriberGrowth.new.toString(),
  totalSubscribers.netSubscriberGrowth.churned.toString(),
  (
    <span style={{
      color: parseInt(totalSubscribers.netSubscriberGrowth.net) > 0 ? "green" : (parseInt(totalSubscribers.netSubscriberGrowth.net) < 0 ? "red" : "black"),
      fontWeight: "bold"
    }}>
      {parseInt(totalSubscribers.netSubscriberGrowth.net) > 0
        ? `↑ ${totalSubscribers.netSubscriberGrowth.net}`
        : (parseInt(totalSubscribers.netSubscriberGrowth.net) < 0
          ? `↓ ${totalSubscribers.netSubscriberGrowth.net}`
          : totalSubscribers.netSubscriberGrowth.net.toString())}
    </span>
  )
],

   [
    'Monthly Recurring Revenue (MRR)',
    `$${totalSubscribers.mrr.current.toFixed(2)}`,
    `$${totalSubscribers.mrr.previous.toFixed(2)}`,
    totalSubscribers.mrr.change === "-" ? "-" : (
      <span style={{
        color: parseFloat(totalSubscribers.mrr.change) > 0 ? "green" : "red",
        fontWeight: "bold"
      }}>
        {parseFloat(totalSubscribers.mrr.change) > 0 ? "↑" : "↓"} {totalSubscribers.mrr.change}
      </span>
    )
  ],
    ['Annual Recurring Revenue (ARR)', '-', '-', '-'],
    // ['ARPU', '$26.67', '-', '-'],
    // ['Customer Acquisition Cost (CAC)', '$12', '-', '-'],
    // ['Lifetime Value (LTV)', '$320', '-', '-'],
    // ['Gross Margin', '80%', '-', '-'],
    // ['Churn Rate', '50', '10', '200%'],
    [
      'Churn Rate',
      totalSubscribers.churnMeta.cancelled.toString(),
      totalSubscribers.churnMeta.base.toString(),
      totalSubscribers.churnRate === 0 ? "-" : (
        <span style={{
          color: parseFloat(totalSubscribers.churnRate) > 0 ? "red" : "green",
          fontWeight: "bold"
        }}>
          {parseFloat(totalSubscribers.churnRate) > 0 ? "↑" : "↓"} {totalSubscribers.churnRate}%
        </span>
      )
    ],

    // ['Retention Rate', '95.8%', '93.3%', '2.5%'],
  ];
  const navigate = useNavigate()
  useEffect(()=>{
    navigate('/app/plans')
  },[])
  return (
    <></>
    // <Page   fullWidth>
    //   <BlockStack gap={800}>
    //       <Card>
    //     <Box padding="4">
    //       <Text variant="headingMd" as="h2">📊 Key Performance Indicators</Text>
    //       <Box paddingBlockStart="4">
    //         <DataTable
    //           columnContentTypes={['text', 'numeric', 'numeric', 'numeric']}
    //           headings={['KPI', 'Current Period', 'Previous Period', 'Change (%)']}
    //           rows={rows}
    //         />
    //       </Box>
    //     </Box>
    //   </Card>
    //   <BlockStack gap={400}>
    //     <InlineStack gap={400} align="end" >

    //       <Button
    //         variant="primary"
    //         // disabled={tableData?.length <= 0}
    //         onClick={() => setShowDatePicker(true)}>{selectedDateLabel}
    //       </Button>
    //       <Button
    //         variant="primary"

    //         onClick={() => handleResourcePicker()}
    //       >
    //         Add products
    //       </Button>
    //     </InlineStack>
    //     </BlockStack>

    //     <BlockStack gap={400}>

    //       <Grid>
    //         <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}>
          
    //           <Box>
    //             <BlockStack gap={300}>
    //               <Text variant="headingMd" fontWeight="bold">
    //                 Subscription Details
    //               </Text>
    //               <InlineGrid gap={200} columns={5}>          
    //                 <Card>
    //                   <InlineStack align="center" gap={1600}>
    //                     <BlockStack gap={200}>
    //                       <Text variant="headingSm">Total</Text>
    //                       <Text variant="headingLg" fontWeight="bold">{stats.total}</Text>
    //                     </BlockStack>
    //                     <div style={{ fontSize: '28px' }}>
    //                       <Icon source={ChartHistogramGrowthIcon} tone="base  " />
    //                     </div>
    //                   </InlineStack>

    //                 </Card>
    //                 <Card>
    //                   <InlineStack align="center" gap={1600}>
    //                     <BlockStack gap={200}>
    //                       <Text variant="headingSm">Cancelled</Text>
    //                       <Text variant="headingLg" fontWeight="bold">{stats.cancelled}</Text>
    //                     </BlockStack>
    //                     <div style={{ fontSize: '28px' }}>
    //                       <Icon source={XCircleIcon} tone="base" />
    //                     </div>
    //                   </InlineStack>
    //                 </Card>
    //                 <Card>
    //                   <InlineStack align="center" gap={1600}>
    //                     <BlockStack gap={200}>
    //                       <Text variant="headingSm">One-Time</Text>
    //                       <Text variant="headingLg" fontWeight="bold">{stats.oneTime}</Text>
    //                     </BlockStack>
    //                     <div style={{ fontSize: '28px' }}>
    //                       <Icon source={ChartHistogramGrowthIcon} tone="base  " />
    //                     </div>
    //                   </InlineStack>
    //                 </Card>
    //                 <Card>
    //                   <InlineStack align="center" gap={1600}>
    //                     <BlockStack gap={200}>
    //                       <Text variant="headingSm">Active</Text>
    //                       <Text variant="headingLg" fontWeight="bold">{stats.active}</Text>
    //                     </BlockStack>
    //                     <div style={{ fontSize: '28px' }}>
    //                       <Icon source={StatusActiveIcon} tone="base  " />
    //                     </div>
    //                   </InlineStack>
    //                 </Card>
    //                 <Card>
    //                   <InlineStack align="center" gap={800}>
    //                     <BlockStack gap={200}>
    //                       <Text variant="headingMd">Total Revenue</Text>
    //                       <Text variant="headingMd" fontWeight="bold">
    //                         ${totalRevenue?.toFixed(2)}
    //                       </Text>
    //                     </BlockStack>
    //                     <div style={{ fontSize: '28px' }}>
    //                       <Icon source={MoneyIcon} tone="base" />
    //                     </div>
    //                   </InlineStack>
    //                 </Card>
    //               </InlineGrid>
    //             </BlockStack>
    //           </Box>

    //         </Grid.Cell>

    //       </Grid>

    //     </BlockStack>
    //     <Card>
    //       <Box padding="4">
    //         <Text variant="headingMd">Sales Over Time</Text>
    //         <Box style={{ height: 300, marginTop: 16 }}>
    //           {/* {console.log("Chart data ===>", filteredData)} */}
    //           <ResponsiveContainer width="100%" height="100%">

    //             <LineChart data={filteredData}>
    //               <CartesianGrid strokeDasharray="3 3" />
    //               <XAxis
    //                 dataKey="date"
    //                 interval={0}
    //                 angle={-45}
    //                 tickFormatter={(day) => {
    //                   const fullDate = new Date(day);
    //                   return fullDate.toLocaleDateString("en-GB", {
    //                     day: "2-digit",
    //                     month: "short",
    //                     year: "numeric",
    //                   });
    //                 }}
    //               />
    //               <YAxis /> 
    //               <Tooltip />
    //               <Legend />
    //               <Line type="monotone" dataKey="sales" stroke="#007bff" />
    //             </LineChart>
    //           </ResponsiveContainer>
    //         </Box>
    //       </Box>
    //     </Card>
    //   </BlockStack>
    //   <Modal
    //     open={showDatePicker}
    //     onClose={() => {
    //       setShowDatePicker(false);
    //     }}
    //     title={"Select Date Range"}
    //     primaryAction={{
    //       content: "filter",
    //       onAction: () => {
    //         setShowDatePicker(false);

    //       },
    //     }}
    //     secondaryActions={[
    //       {
    //         content: "Cancel",
    //         onAction: () => {
    //           setShowDatePicker(false);
    //         },
    //       },
    //     ]}
    //   >
    //     <Modal.Section>
    //       <BlockStack gap={5}>
    //         <DatePicker
    //           month={month}
    //           year={year}
    //           onChange={setSelectedDates}
    //           onMonthChange={handleMonthChange}
    //           selected={selectedDates}
    //           multiMonth
    //           allowRange
    //         />
    //       </BlockStack>
    //     </Modal.Section>
    //   </Modal>

    // </Page>

  );
}






