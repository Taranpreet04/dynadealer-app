import { useActionData, useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import TableSkeleton from "../components/tableSkeleton";
// import { useNavigate } from "@remix-run/react";
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
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import { DeleteIcon } from "@shopify/polaris-icons";

import React from "react";
import {
  updateRaffleProducts,
  getRaffleProducts,
} from "../controllers/planController";
import { Knob } from "../components/knob";
import { sendMailToAll } from "../db.mailcontroller";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  // let data = await getRaffleProducts(admin);
  // return { data: data?.data };
  return {data: 'ok'}
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const body = await request.formData();
  let products = JSON.parse(body.get("products"));
  let data = JSON.parse(body.get("data"));
  if (products) {
    let res = await updateRaffleProducts(admin, products);
    return { message: "success", data: res };
  } else if (data) {
    console.log("data-- in else if=", data);
    let res = await sendMailToAll(admin, data);
    return { message: "success", data: res };
  }
};
export default function Index() {

  const navigate= useNavigate()

  useEffect(()=>{
    navigate('/app/plans')
  }, [])
  // const [products, setProducts] = useState([]);
  // const [productIds, setProductIds] = useState([]);
  // const [dltBtnLoader, setDltBtnLoader] = useState(false);
  // const [openModal, setOpenModal] = useState(false);
  // const [statusChangeId, setStatusChangeId] = useState("");
  // const [raffleType, setRaffleType] = useState("unlimited");
  // const [spots, setSpots] = useState(0);
  // const [deleteId, setDeleteId] = useState("");
  // const [tableSkel, setTableSkel] = useState(false);
  // const [reCheck, setReCheck] = useState(false);
  // const [notifyId, setNotifyId] = useState("");
  // const [newProduct, setNewProduct] = useState({});

  // const submit = useSubmit();
  // const loaderData = useLoaderData();
  // const actionData = useActionData();

  // useEffect(() => {
  //   console.log("loader again");
  //   if (loaderData) {
  //     setTableSkel(false);
  //     loaderData?.data?.products ? setProducts(loaderData?.data?.products) : "";
  //     setStatusChangeId("");
  //     setNotifyId("");
  //   }
  // }, [loaderData]);

  // useEffect(() => {
  //   if (actionData?.message === "success") {
  //     setTableSkel(true);
  //     setDltBtnLoader(false);
  //     console.log(statusChangeId, deleteId, notifyId);
  //     statusChangeId
  //       ? shopify.toast.show("Status update successfully.", { duration: 5000 })
  //       : deleteId
  //         ? shopify.toast.show("Product deleted successfully.", {
  //             duration: 5000,
  //           })
  //         : notifyId
  //           ? shopify.toast.show("Mail sent to all successfully.", {
  //               duration: 5000,
  //             })
  //           : shopify.toast.show("Add raffle products successfully", {
  //               duration: 5000,
  //             });
  //   }
  // }, [actionData]);

  // useEffect(() => {
  //   if (products?.length > 0) {
  //     let selectedIds = [];
  //     products?.map((item) => {
  //       selectedIds.push({ id: item?.id });
  //     });
  //     setProductIds(selectedIds);
  //   }
//   }, [products]);

//   const handleResourcePicker = async () => {
//     const productPickerData = await shopify.resourcePicker({
//       type: "product",
//       filter: {
//         draft: false,
//         variants: false,
//       },
//       // selectionIds: productIds,
//       // multiple: true,
//     });
//     let sendData = [];
//     console.log("productPickerData==", productPickerData[0]?.title)
//     if (productPickerData !== undefined) {
//       productPickerData?.map((item) => {
//         let existProduct = products?.filter((itm) => itm?.id == item?.id);
//         console.log("existProduct=", existProduct);
//         existProduct?.length > 0
//           ? sendData.push(existProduct[0])
//           : sendData.push({
//               id: item.id,
//               title: item.title,
//               totalInventory: item.totalInventory,
//               status: true,
//             });
//       });
//       console.log("existProduct=", sendData);
//       setNewProduct({
//         productId: productPickerData[0]?.id,
//         productName: productPickerData[0]?.title,
//         inventory: productPickerData[0]?.totalInventory,
//         status: true,

//       })
//       // let formData = {
//       //   products: JSON.stringify(sendData),
//       // };
//       // submit(formData, {
//       //   method: "POST",
//       // });
//     }
//   };

//   const handleChange = (id) => {
//     setStatusChangeId(id);
//     let updatedProducts = [];
//     products.map((itm) =>
//       updatedProducts.push(
//         itm.id === id ? { ...itm, status: !itm.status } : itm,
//       ),
//     );
//     let formData = { products: JSON.stringify(updatedProducts) };
//     submit(formData, { method: "POST" });
//   };

//   const rows = products?.map((item, index) => [
//     <Text> {item?.title} </Text>,
//     <Text> {item?.totalInventory} </Text>,
//     <>
//       {" "}
//       {statusChangeId == item?.id ? (
//         <Spinner accessibilityLabel="Small spinner example" size="small" />
//       ) : (
//         <Knob
//           selected={item?.status}
//           ariaLabel="Example knob"
//           onClick={() => handleChange(item?.id)}
//         />
//       )}
//     </>,
//     <InlineStack as="span" align="end" gap={300}>
//       <Button
//         variant="primary"
//         loading={item?.id == notifyId ? true : false}
//         disabled={!item?.status}
//         onClick={() => {
//           setNotifyId(item?.id);
//           let formData = {
//             data: JSON.stringify(item),
//           };
//           submit(formData, {
//             method: "POST",
//           });
//         }}
//       >
//         Notify all
//       </Button>

//       <span
//         onClick={() => {
//           setReCheck(true);
//           setDeleteId(item?.id);
//         }}
//       >
//         {deleteId == item?.id && dltBtnLoader ? (
//           <Spinner accessibilityLabel="Small spinner example" size="small" />
//         ) : (
//           <Icon source={DeleteIcon} alignment="end" />
//         )}
//       </span>
//     </InlineStack>,
//   ]);

//   const handleDelete = () => {
//     setDltBtnLoader(true);
//     let filteredProducts = [];
//     if (deleteId) {
//       filteredProducts = products?.filter(
//         (product) => deleteId !== product?.id,
//       );
//       let formData = {
//         products: JSON.stringify(filteredProducts),
//       };
//       submit(formData, {
//         method: "POST",
//       });
//     }
//   };

//  const saveProduct=()=>{

//   }
  return (
    <></>
    // <>
    //   {tableSkel ? (
    //     <TableSkeleton />
    //   ) : (
    //     <Page
    //       title="Raffle Products"
    //       primaryAction={
    //         <Button variant="primary" onClick={() => setOpenModal(true)}>
    //           Add products
    //         </Button>
    //       }
    //     >
    //       {products?.length > 0 ? (
    //         <Box paddingBlockStart={300}>
    //           <DataTable
    //             hasZebraStripingOnData
    //             hoverable
    //             stickyHeader
    //             columnContentTypes={["text", "text", "text", "text"]}
    //             headings={[
    //               <Text variant="headingSm" as="h6">
    //                 Product Name
    //               </Text>,
    //               <Text variant="headingSm" as="h6">
    //                 {" "}
    //                 Total Inventory
    //               </Text>,
    //               <Text variant="headingSm" as="h6">
    //                 {" "}
    //                 Status
    //               </Text>,
    //               <Text variant="headingSm" alignment="end" as="h6">
    //                 {" "}
    //                 Action
    //               </Text>,
    //             ]}
    //             rows={rows}
    //             verticalAlign="middle"
    //           />
    //         </Box>
    //       ) : (
    //         <Card>
    //           <EmptyState
    //             heading="Let's create your first subscription plan."
    //             image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    //           ></EmptyState>
    //         </Card>
    //       )}
    //       <div className="sd-ultimate-option-AlertModal">
    //         <Modal
    //           open={reCheck}
    //           onClose={() => setReCheck(false)}
    //           title={"Delete Product ?"}
    //           primaryAction={{
    //             content: "Delete",
    //             onAction: () => {
    //               setReCheck(false);
    //               // setDltBtnLoader(true)
    //               handleDelete();
    //             },
    //           }}
    //           secondaryActions={[
    //             {
    //               content: "Cancel",
    //               onAction: () => {
    //                 setReCheck(false);
    //               },
    //             },
    //           ]}
    //         >
    //           <Modal.Section>
    //             <BlockStack gap={5}>
    //               <p>
    //                 Are you sure you want to delete this product from list? This
    //                 can't be restored.
    //               </p>
    //             </BlockStack>
    //           </Modal.Section>
    //         </Modal>
    //       </div>{" "}
    //       <div className="sd-ultimate-option-AlertModal">
    //         <Modal
    //           open={openModal}
    //           onClose={() => setOpenModal(false)}
    //           title={"Add Product"}
    //           primaryAction={{
    //             content: "Add",
    //             onAction: () => {
    //               setOpenModal(false);
    //               // setDltBtnLoader(true)
    //               // handleDelete();
    //               saveProduct()
    //             },
    //           }}
    //           secondaryActions={[
    //             {
    //               content: "Cancel",
    //               onAction: () => {
    //                 setOpenModal(false);
    //               },
    //             },
    //           ]}
    //         >
    //           <Modal.Section>
    //             <BlockStack gap={5}>
    //             <Grid>
    //                 <Grid.Cell
    //                   columnSpan={{ xs: 6, sm: 6, md: 9, lg: 9, xl: 9 }}
    //                 >
    //                   <Text as="h2" variant="headingSm">
    //                     Products
    //                   </Text>
    //                 </Grid.Cell>
    //                 <Grid.Cell
    //                   columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}
    //                 >
    //                   <Box paddingBlockStart="200">
    //                     <Button onClick={handleResourcePicker}>
    //                       Add Product
    //                     </Button>
    //                   </Box>
    //                 </Grid.Cell>
    //               </Grid>
    //               <Card>
    //                 <Grid>
    //                   <Grid.Cell
    //                     columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
    //                     style={{ display: "flex", alignItems: "flex-end" }}
    //                   >
    //                     <ChoiceList
    //                       title="Is this a capped giveaway or time-limt giveaway ?"
    //                       choices={[
    //                         { label: "Limited-spots", value: "limited" },
    //                         { label: "Unlimited-spots", value: "unlimited" },
    //                       ]}
    //                       selected={raffleType}
    //                       onChange={(value) =>
    //                        setRaffleType(value)
    //                       }
    //                     />
    //                   </Grid.Cell>
    //                     {raffleType === "limited" && (
    //                       <>
    //                         <Grid.Cell
    //                           columnSpan={{ xs: 9, sm: 9, md: 9, lg: 9, xl: 9 }}
    //                           style={{
    //                             display: "flex",
    //                             alignItems: "flex-end",
    //                           }}
    //                         >
    //                           <Text as="h2" variant="headingSm">
    //                             How much spots per person can have?
    //                           </Text>
    //                         </Grid.Cell>
    //                         <Grid.Cell
    //                           columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}
    //                         >
    //                           <TextField
    //                             label="How much spots per person can have?"
    //                             type="number"
    //                             labelHidden
    //                             value={spots}
    //                             onChange={(value) => setSpots(value)}
    //                             autoComplete="off"
    //                             align="right"
    //                           />
    //                         </Grid.Cell>
    //                       </>
    //                     )}
    //                     <Grid.Cell
    //                       columnSpan={{
    //                         xs: 12,
    //                         sm: 12,
    //                         md: 12,
    //                         lg: 12,
    //                         xl: 12,
    //                       }}
    //                       style={{ display: "flex", alignItems: "flex-end" }}
    //                     >
    //                       <Text as="h2" variant="headingSm">
    //                         Note: Manage your spots through inventory and update
    //                         it accordingly. Ignore if already managed.
    //                       </Text>
    //                     </Grid.Cell>
                     
    //                 </Grid>
    //               </Card>
    //             </BlockStack>
    //           </Modal.Section>
    //         </Modal>
    //       </div>{" "}
    //     </Page>
    //   )}
    // </>
  );
}

// import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
// import { authenticate } from "../shopify.server";
// import TableSkeleton from "../components/tableSkeleton";
// // import { useNavigate } from "@remix-run/react";
// import {
//   Button,
//   Page,
//   Card,
//   EmptyState,
//   IndexTable,
//   Link,
//   EmptySearchResult,
//   InlineStack,
//   Icon,
//   useIndexResourceState,
//   Text,
//   Box,
//   DataTable,
//   Modal,
//   BlockStack,
//   Spinner,
// } from "@shopify/polaris";
// import { useEffect, useState } from "react";
// import { DeleteIcon } from "@shopify/polaris-icons";

// import React from "react";
// import {
//   updateRaffleProducts,
//   getRaffleProducts,
// } from "../controllers/planController";
// import { Knob } from "../components/knob";
// import { sendMailToAll } from "../db.mailcontroller";

// export const loader = async ({ request }) => {
//   const { admin } = await authenticate.admin(request);
//   let data = await getRaffleProducts(admin);
//   return { data: data?.data };
// };

// export const action = async ({ request }) => {
//   const { admin } = await authenticate.admin(request);
//   const body = await request.formData();
//   let products = JSON.parse(body.get("products"));
//   let data = JSON.parse(body.get("data"));
//   if (products) {
//     let res = await updateRaffleProducts(admin, products);
//     return { message: "success", data: res };
//   } else if (data) {
//     console.log("data-- in else if=", data);
//     let res = await sendMailToAll(admin, data);
//     return { message: "success", data: res };
//   }
// };
// export default function Index() {
//   const [products, setProducts] = useState([]);
//   const [productIds, setProductIds] = useState([]);
//   const [dltBtnLoader, setDltBtnLoader] = useState(false);
//   const [statusChangeId, setStatusChangeId] = useState("");
//   const [deleteId, setDeleteId] = useState("");
//   const [tableSkel, setTableSkel] = useState(false);
//   const [reCheck, setReCheck] = useState(false);
//   const [notifyId, setNotifyId] = useState("");

//   const submit = useSubmit();
//   const loaderData = useLoaderData();
//   const actionData = useActionData();

//   useEffect(() => {
//     console.log("loader again");
//     if (loaderData) {
//       setTableSkel(false);
//       loaderData?.data?.products ? setProducts(loaderData?.data?.products) : "";
//       setStatusChangeId("");
//       setNotifyId("");
//     }
//   }, [loaderData]);

//   useEffect(() => {
//     if (actionData?.message === "success") {
//       setTableSkel(true);
//       setDltBtnLoader(false);
//       console.log(statusChangeId, deleteId, notifyId);
//       statusChangeId
//         ? shopify.toast.show("Status update successfully.", { duration: 5000 })
//         : deleteId
//           ? shopify.toast.show("Product deleted successfully.", {
//               duration: 5000,
//             })
//           : notifyId
//             ? shopify.toast.show("Mail sent to all successfully.", {
//                 duration: 5000,
//               })
//             : shopify.toast.show("Add raffle products successfully", {
//                 duration: 5000,
//               });
//     }
//   }, [actionData]);

//   useEffect(() => {
//     if (products?.length > 0) {
//       let selectedIds = [];
//       products?.map((item) => {
//         selectedIds.push({ id: item?.id });
//       });
//       setProductIds(selectedIds);
//     }
//   }, [products]);

//   const handleResourcePicker = async () => {
//     const productPickerData = await shopify.resourcePicker({
//       type: "product",
//       filter: {
//         draft: false,
//         variants: false,
//       },
//       selectionIds: productIds,
//       multiple: true,
//     });
//     let sendData = [];
//     if (productPickerData !== undefined) {
//       productPickerData?.map((item) => {
//         let existProduct = products?.filter((itm) => itm?.id == item?.id);
//         console.log("existProduct=", existProduct);
//         existProduct?.length > 0
//           ? sendData.push(existProduct[0])
//           : sendData.push({
//               id: item.id,
//               title: item.title,
//               totalInventory: item.totalInventory,
//               status: true,
//             });
//       });
//       console.log("existProduct=", sendData);
//       let formData = {
//         products: JSON.stringify(sendData)
//       }
//       submit(formData, {
//         method: 'POST'
//       })
//     }
//   };

//   const handleChange = (id) => {
//     setStatusChangeId(id);
//     let updatedProducts = [];
//     products.map((itm) =>
//       updatedProducts.push(
//         itm.id === id ? { ...itm, status: !itm.status } : itm,
//       ),
//     );
//     let formData = { products: JSON.stringify(updatedProducts) };
//     submit(formData, { method: "POST" });
//   };

//   const rows = products?.map((item, index) => [
//     <Text> {item?.title} </Text>,
//     <Text> {item?.totalInventory} </Text>,
//     <>
//       {" "}
//       {statusChangeId == item?.id ? (
//         <Spinner accessibilityLabel="Small spinner example" size="small" />
//       ) : (
//         <Knob
//           selected={item?.status}
//           ariaLabel="Example knob"
//           onClick={() => handleChange(item?.id)}
//         />
//       )}
//     </>,
//     <InlineStack as="span" align="end" gap={300}>
//       <Button
//         variant="primary"
//         loading={item?.id == notifyId ? true : false}
//         disabled={!item?.status}
//         onClick={() => {
//           setNotifyId(item?.id);
//           let formData = {
//             data: JSON.stringify(item),
//           };
//           submit(formData, {
//             method: "POST",
//           });
//         }}
//       >
//         Notify all
//       </Button>

//       <span
//         onClick={() => {
//           setReCheck(true);
//           setDeleteId(item?.id);
//         }}
//       >
//         {deleteId == item?.id && dltBtnLoader ? (
//           <Spinner accessibilityLabel="Small spinner example" size="small" />
//         ) : (
//           <Icon source={DeleteIcon} alignment="end" />
//         )}
//       </span>
//     </InlineStack>,
//   ]);

//   const handleDelete = () => {
//     setDltBtnLoader(true);
//     let filteredProducts = [];
//     if (deleteId) {
//       filteredProducts = products?.filter(
//         (product) => deleteId !== product?.id,
//       );
//       let formData = {
//         products: JSON.stringify(filteredProducts),
//       };
//       submit(formData, {
//         method: "POST",
//       });
//     }
//   };
//   return (
//     <>
//       {tableSkel ? (
//         <TableSkeleton />
//       ) : (
//         <Page
//           title="Raffle Products"
//           primaryAction={
//             <Button variant="primary" onClick={() => handleResourcePicker()}>
//               Select products
//             </Button>
//           }
//         >
//           {products?.length > 0 ? (
//             <Box paddingBlockStart={300}>
//               <DataTable
//                 hasZebraStripingOnData
//                 hoverable
//                 stickyHeader
//                 columnContentTypes={["text", "text", "text", "text"]}
//                 headings={[
//                   <Text variant="headingSm" as="h6">
//                     Product Name
//                   </Text>,
//                   <Text variant="headingSm" as="h6">
//                     {" "}
//                     Total Inventory
//                   </Text>,
//                   <Text variant="headingSm" as="h6">
//                     {" "}
//                     Status
//                   </Text>,
//                   <Text variant="headingSm" alignment="end" as="h6">
//                     {" "}
//                     Action
//                   </Text>,
//                 ]}
//                 rows={rows}
//                 verticalAlign="middle"
//               />
//             </Box>
//           ) : (
//             <Card>
//               <EmptyState
//                 heading="Let's create your first subscription plan."
//                 image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
//               ></EmptyState>
//             </Card>
//           )}
//           <div className="sd-ultimate-option-AlertModal">
//             <Modal
//               open={reCheck}
//               onClose={() => setReCheck(false)}
//               title={"Delete Product ?"}
//               primaryAction={{
//                 content: "Delete",
//                 onAction: () => {
//                   setReCheck(false);
//                   // setDltBtnLoader(true)
//                   handleDelete();
//                 },
//               }}
//               secondaryActions={[
//                 {
//                   content: "Cancel",
//                   onAction: () => {
//                     setReCheck(false);
//                   },
//                 },
//               ]}
//             >
//               <Modal.Section>
//                 <BlockStack gap={5}>
//                   <p>
//                     Are you sure you want to delete this product from list? This
//                     can't be restored.
//                   </p>
//                 </BlockStack>
//               </Modal.Section>
//             </Modal>
//           </div>{" "}
//         </Page>
//       )}
//     </>
//   );
// }
