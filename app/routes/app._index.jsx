import { useActionData, useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
// import { ResourcePicker } from "@shopify/app-bridge-react";

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
import { DeleteIcon } from "@shopify/polaris-icons";

import React from "react";

import { Knob } from "../components/knob";


const data = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2025, 5, i + 1); // June = month 5
  return {
    date: (i + 1).toString(), // format: YYYY-MM-DD
    sales: Math.floor(Math.random() * 200) + 50, // random sales between 50-250
  };
});

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  // let data = await getRaffleProducts(admin);
  // return { data: data?.data };
  return null
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const body = await request.formData();

  return null
};
export default function Index() {
  const [selectedProduct, setSelectedProduct] = useState("all");
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

  const filteredData = data.filter((item) => {
    const itemDate = new Date(2025, 5, parseInt(item.date)); // June = 5
    const start = new Date(selectedDates.start);
    const end = new Date(selectedDates.end);
    itemDate.setHours(0, 0, 0, 0);
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
  return (
    <Page title="Analytics Dashboard">
      <BlockStack gap={400}>
      <InlineStack gap={400} align="end" >
        <Button
          variant="primary"
          // disabled={tableData?.length <= 0}
          onClick={() => setShowDatePicker(true)}>select date
        </Button>
        <Button
          variant="primary"

          onClick={() => handleResourcePicker()}
        >
          Add products
        </Button>
      </InlineStack>
<BlockStack gap={400}>
     
      <Grid>
        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 8, xl: 12 }}>
          <Card>
            <Box padding="4">
              <Text variant="headingMd" fontWeight="bold">
                Subscription Details
              </Text>
              <InlineGrid gap={200} columns={4}>
                <Card>
                  <Text variant="headingSm">Total</Text>
                  <Text variant="headingLg" fontWeight="bold">150</Text>
                </Card>
                <Card>
                  <Text variant="headingSm">Cancelled</Text>
                  <Text variant="headingLg" fontWeight="bold">25</Text>
                </Card>
                <Card>
                  <Text variant="headingSm">One-Time</Text>
                  <Text variant="headingLg" fontWeight="bold">52</Text>
                </Card>
                <Card>
                  <Text variant="headingSm">Active</Text>
                  <Text variant="headingLg" fontWeight="bold">73</Text>
                </Card>
              </InlineGrid>
            </Box>
          </Card>
        </Grid.Cell>

        <Grid.Cell columnSpan={{ xs: 1, sm: 2, md: 4, lg: 2, xl: 4 }}>
          <Card>
            <Box padding="4">
              <Text variant="headingMd">Total Revenue</Text>
              <Text variant="headingMd" fontWeight="bold">
                $5,290.00
              </Text>
            </Box>
          </Card>
        </Grid.Cell>
      </Grid>
    
    </BlockStack>
      <Card>
        <Box padding="4">
          <Text variant="headingMd">Sales Over Time</Text>
          <Box style={{ height: 300, marginTop: 16 }}>
            {console.log("Chart data ===>", filteredData)}
            <ResponsiveContainer width="100%" height="100%">
             
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  interval={0}
                  angle={-45}
                  tickFormatter={(day) => {
                    const fullDate = new Date(2025, 5, parseInt(day)); // June = 5
                    return fullDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });
                  }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#007bff" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Card>
</BlockStack>
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

    </Page>

  );
}






