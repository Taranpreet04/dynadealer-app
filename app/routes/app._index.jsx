import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import TableSkeleton from "../components/tableSkeleton";
// import { useNavigate } from "@remix-run/react";
import {
  Button, Page, Card, EmptyState, IndexTable,
  Link, EmptySearchResult,InlineStack,Icon,
  useIndexResourceState,
  Text, Box, DataTable, Modal, BlockStack,
  Spinner
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import {  DeleteIcon } from "@shopify/polaris-icons"

import React from 'react';
import { updateRaffleProducts, getRaffleProducts, sendMailToAll } from "../controllers/planController";
import { Knob } from "../components/knob";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  let data = await getRaffleProducts(admin)
  return { data: data?.data }
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const body = await request.formData();
  let products = JSON.parse(body.get("products"));
  let data = JSON.parse(body.get("data"));
  if (products) {
    let res = await updateRaffleProducts(admin, products)
    return { message: 'success', data: res };
  } else if (data) {
    console.log("data-- in else if=", data)
    let res = await sendMailToAll(admin, data)
    return { message: 'success', data: res };
  }
};
export default function Index() {
  const [products, setProducts] = useState([])
  const [productIds, setProductIds] = useState([])
  const [dltBtnLoader, setDltBtnLoader] = useState(false)
  const [statusChangeId, setStatusChangeId] = useState('')
  const [deleteId, setDeleteId] = useState('')
  const [tableSkel, setTableSkel] = useState(false);
  const [reCheck, setReCheck] = useState(false);
  const [notifyId, setNotifyId] = useState('');
 
  const submit = useSubmit()
  const loaderData = useLoaderData()
  const actionData = useActionData()
 
  useEffect(() => {
    console.log("loader again")
    if (loaderData) {
      setTableSkel(false)
      loaderData?.data?.products ?
        setProducts(loaderData?.data?.products) : ''
        setStatusChangeId('')
        setNotifyId('')
    }
  }, [loaderData])

  useEffect(() => {
    if (actionData?.message === 'success') {
      setTableSkel(true)
      setDltBtnLoader(false)
      console.log(statusChangeId,deleteId, notifyId)
      statusChangeId ?  shopify.toast.show("Status update successfully.", { duration: 5000 }):
      deleteId? shopify.toast.show("Product deleted successfully.", { duration: 5000 }):
      notifyId? shopify.toast.show("Mail sent to all successfully.", { duration: 5000 }):
      shopify.toast.show("Add raffle products successfully", { duration: 5000 })
    }
  }, [actionData])

  useEffect(() => {
    if (products?.length > 0) {
      let selectedIds = []
      products?.map((item) => {
        selectedIds.push({ id: item.id });
      });
      setProductIds(selectedIds)
    }
  }, [products])

  const handleResourcePicker = async () => {
    const productPickerData = await shopify.resourcePicker({
      type: "product",
      filter: {
        draft: false,
        variants: false,
      },
      selectionIds: productIds,
      multiple: true,
    });
    let sendData = []
    if (productPickerData !== undefined) {
      productPickerData?.map((item) => {
        sendData.push({
          id: item.id,
          title: item.title,
          totalInventory: item.totalInventory,
          status: true,
        });
      });
      let formData = {
        products: JSON.stringify(sendData)
      }
      submit(formData, {
        method: 'POST'
      })
    }
  }
  

  const handleChange = (id) => {
    setStatusChangeId(id)
    let updatedProducts = []
    products.map((itm) =>
      updatedProducts.push(itm.id === id ? { ...itm, status: !itm.status } : itm)
    );
    console.log("updatedProducts==", updatedProducts)
    let formData = { products: JSON.stringify(updatedProducts) };
    submit(formData, { method: "POST" });
  };

  console.log("products==", products)
  

  const rows = products?.map((item, index) => [
    <Text> {item?.title} </Text>,
    <Text> {item?.totalInventory} </Text>,
  <> {statusChangeId == item?.id?
    <Spinner accessibilityLabel="Small spinner example" size="small" /> :
    <Knob
     selected={item?.status}
     ariaLabel='Example knob'
     onClick={() => handleChange(item?.id)}
   />}
  </> ,
   <InlineStack as="span" align="end" gap={300}>
        
        <Button
            variant="primary"
            loading={item?.id==notifyId? true: false}
            disabled={!item?.status}
            onClick={() => { 
              setNotifyId(item?.id)
              let formData = {
                data: JSON.stringify(item)
              }
              submit(formData, {
                method: 'POST'
              })
            }}
          >
            Notify all
          </Button>
       
        <span onClick={() => {
          setReCheck(true);
          setDeleteId(item?.id);
        }} >
          {deleteId== item?.id && dltBtnLoader ?<Spinner accessibilityLabel="Small spinner example" size="small" /> :
          <Icon source={DeleteIcon} alignment='end'/>}
          
        </span>
      </InlineStack>,
  ])



  const handleDelete = () => {
    setDltBtnLoader(true)
    let filteredProducts = []
    if (deleteId) {
      filteredProducts = products?.filter(product => deleteId!==product?.id);
      console.log("filteredProducts==", filteredProducts)
      let formData = {
        products: JSON.stringify(filteredProducts)
      }
      submit(formData, {
        method: 'POST'
      })
    }
  }
  return (
    <>
      {tableSkel ? <TableSkeleton /> :

        <Page title="Raffle Products" primaryAction={<Button
          variant="primary"
          onClick={() => handleResourcePicker()}>Select products</Button>}
         >
          <Box paddingBlockStart={300}>
            <DataTable
              hasZebraStripingOnData
              hoverable
              stickyHeader
              columnContentTypes={["text", "text", "text", "text"]}
              headings={[
                <Text variant="headingSm" as="h6">
                  Product Name
                </Text>,
                <Text variant="headingSm" as="h6">
                  {" "}
                 Total Inventory
                </Text>,
                <Text variant="headingSm" as="h6">
                  {" "}
                Status
                </Text>,
                <Text variant="headingSm" alignment="end" as="h6">
                  {" "}
                Action
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
              title={"Delete Product ?"}
              primaryAction={{
                content: "Delete",
                onAction: () => {
                  setReCheck(false)
                  // setDltBtnLoader(true)
                  handleDelete()
                },
              }}
              secondaryActions={[
                {
                  content: "Cancel",
                  onAction: () => {
                    setReCheck(false);
                  },
                },
              ]}
            >
              <Modal.Section>
                <BlockStack gap={5}>
                  <p>
                    Are you sure you want to delete this product from list? This can't
                    be restored.
                  </p>
                </BlockStack>
              </Modal.Section>
            </Modal>
          </div>
            {/* <Card>
            <IndexTable
              // condensed={useBreakpoints().smDown}
              resourceName={resourceName}
              itemCount={products?.length}
              emptyState={emptyStateMarkup}
              selectedItemsCount={
                allResourcesSelected ? 'All' : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: 'Product Name' },
                // { title: 'Total Inventory' },
                {
                  id: 'total-inventory',
                  title: (
                    <Text as="span" alignment="center">
                      Total Inventory
                    </Text>
                  ),
                },
                {
                  id: 'status',
                  title: (
                    <Text as="span" alignment="end">
                      Status
                    </Text>
                  ),
                },
                {
                  id: 'action',
                  title: (
                    <Text as="span" alignment="end">
                      Action
                    </Text>
                  ),
                },
              ]}
            >
              {rowMarkup}
            </IndexTable>
          </Card> */}
     
        </Page>
      }
    </>
  )
}
















// import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
// import { authenticate } from "../shopify.server";
// import TableSkeleton from "../components/tableSkeleton";
// // import { useNavigate } from "@remix-run/react";
// import {
//   Button, Page, Card, EmptyState, IndexTable,
//   Link, EmptySearchResult,
//   useIndexResourceState,
//   Text, Box, DataTable, Modal, BlockStack
// } from "@shopify/polaris";
// import { useEffect, useState } from "react";

// import React from 'react';
// import { updateRaffleProducts, getRaffleProducts, sendMailToAll } from "../controllers/planController";
// import { Knob } from "../components/knob";

// export const loader = async ({ request }) => {
//   const { admin } = await authenticate.admin(request);
//   let data = await getRaffleProducts(admin)
//   return { data: data?.data }
// };

// export const action = async ({ request }) => {
//   const { admin } = await authenticate.admin(request);
//   // console.log("request==", request)
//   const body = await request.formData();
//   let products = JSON.parse(body.get("products"));
//   let data = JSON.parse(body.get("data"));
//   if (products) {
//     let res = await updateRaffleProducts(admin, products)
//     return { message: 'success', data: res };
//   } else if (data) {
//     console.log("data-- in else if=", data)
//     let res = await sendMailToAll(admin, data)
//     return { message: 'success', data: res };
//   }
// };
// export default function Index() {
//   const [products, setProducts] = useState([])
//   const [productIds, setProductIds] = useState([])
//   const [dltBtnLoader, setDltBtnLoader] = useState(false)
//   const [tableSkel, setTableSkel] = useState(false);
//   const [reCheck, setReCheck] = useState(false);
//   // const [statusChange, setStatusChange] = useState(false);
//   const [sendMail, setSendMail] = useState({
//     check: false,
//     product: {}
//   });
//   const submit = useSubmit()
//   const loaderData = useLoaderData()
//   const actionData = useActionData()
//   const resourceName = {
//     singular: 'product',
//     plural: 'products',
//   };

//   const { selectedResources, allResourcesSelected, handleSelectionChange } =
//     useIndexResourceState(products);

//   useEffect(() => {
//     alert(sendMail?.check)
//     console.log("sendMail?.check--", sendMail?.check)
//     if (sendMail?.check && sendMail?.product) {
//       let formData = {
//         data: JSON.stringify(sendMail?.product)
//       }
//       submit(formData, {
//         method: 'POST'
//       })
//       setSendMail({ check: false, product: {} }); // ✅ Runs only when clicked
//     }
//   }, [sendMail?.check])
//   const handleChange = (id) => {
//     alert("knob")
//     setTableSkel(true)
//     let updatedProducts = []
//     products.map((itm) =>
//       updatedProducts.push(itm.id === id ? { ...itm, status: !itm.status } : itm)
//     );
//     console.log("updatedProducts==", updatedProducts)
//     let formData = { products: JSON.stringify(updatedProducts) };
//     submit(formData, { method: "POST" });
//   };

//   console.log("products==", products)
//   const rowMarkup = products?.map(
//     (item, index) => (
//       <IndexTable.Row
//         id={item?.id}
//         key={item?.id}
//         selected={selectedResources.includes(item?.id)}
//         position={index}
//       >

//         <IndexTable.Cell>{item?.title}</IndexTable.Cell>
//         <IndexTable.Cell>
//           <Text as="span" alignment="center" numeric>
//             {item?.totalInventory}
//           </Text>
//         </IndexTable.Cell>
//         <IndexTable.Cell>
//           <Knob
//             selected={item?.status}
//             ariaLabel='Example knob'
//             onClick={() => handleChange(item?.id)}
//           />
   
//         </IndexTable.Cell>
//         <IndexTable.Cell>
//           <Link
//             dataPrimaryLink
//             url="#"
//             onClick={(e) => {
//               e.preventDefault(); // Stops navigation
//               setSendMail({ check: true, product: item }); // ✅ Runs only when clicked
//             }}
//             style={{ textDecoration: "none" }} // Prevents default styling
//           >
//             <Text fontWeight="bold" as="span" alignment="end">
//               Send mail to all
//             </Text>
//           </Link>
//         </IndexTable.Cell>

//       </IndexTable.Row>
//     ),
//   );

//   const rows = products?.map((item, index) => [
//     // <Text><img src={item?.title} height={50} width={50} /></Text>,
//     <Text> {item?.title} </Text>,
//     <Text> {item?.totalInventory} </Text>,
//     <Text> {item?.status} </Text>,
//     <Text>delete</Text>,
//   ])
//   const emptyStateMarkup = (
//     <EmptySearchResult
//       title={'No products yet...!'}
//       description={'Click on select products button and add them to see results.'}
//       withIllustration
//     />
//   );

//   useEffect(() => {
//     console.log("loader again")
//     if (loaderData) {
//       setTableSkel(false)
//       loaderData?.data?.products ?
//         setProducts(loaderData?.data?.products) : ''
//       handleSelectionChange("all", false);
//     }
//   }, [loaderData])

//   useEffect(() => {
//     if (actionData?.message === 'success') {
//       setTableSkel(true)
//       setDltBtnLoader(false)
//     }
//   }, [actionData])

//   useEffect(() => {
//     if (products?.length > 0) {
//       let selectedIds = []
//       products?.map((item) => {
//         selectedIds.push({ id: item.id });
//       });
//       setProductIds(selectedIds)
//     }
//   }, [products])

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
//     let sendData = []
//     if (productPickerData !== undefined) {
//       productPickerData?.map((item) => {
//         sendData.push({
//           id: item.id,
//           title: item.title,
//           totalInventory: item.totalInventory,
//           status: true,
//         });
//       });
//       let formData = {
//         products: JSON.stringify(sendData)
//       }
//       submit(formData, {
//         method: 'POST'
//       })
//     }
//   }

//   const handleDelete = () => {
//     setDltBtnLoader(true)
//     let filteredProducts = []
//     if (selectedResources) {
//       filteredProducts = products?.filter(product => !selectedResources.includes(product.id));
//       let formData = {
//         products: JSON.stringify(filteredProducts)
//       }
//       submit(formData, {
//         method: 'POST'
//       })
//     }
//   }
//   return (
//     <>
//       {tableSkel ? <TableSkeleton /> :

//         <Page title="Raffle Products" primaryAction={<Button
//           variant="primary"
//           onClick={() => handleResourcePicker()}>Select products</Button>}
//           secondaryActions={<Button
//             loading={dltBtnLoader}
//             variant="primary"
//             tone="critical"
//             disabled={
//               selectedResources?.length <= 0 ? true : false}
//             onClick={() => { setReCheck(true) }}
//           >
//             Delete
//           </Button>}>
//           <Card>
//             <IndexTable
//               // condensed={useBreakpoints().smDown}
//               resourceName={resourceName}
//               itemCount={products?.length}
//               emptyState={emptyStateMarkup}
//               selectedItemsCount={
//                 allResourcesSelected ? 'All' : selectedResources.length
//               }
//               onSelectionChange={handleSelectionChange}
//               headings={[
//                 { title: 'Product Name' },
//                 // { title: 'Total Inventory' },
//                 {
//                   id: 'total-inventory',
//                   title: (
//                     <Text as="span" alignment="center">
//                       Total Inventory
//                     </Text>
//                   ),
//                 },
//                 {
//                   id: 'status',
//                   title: (
//                     <Text as="span" alignment="end">
//                       Status
//                     </Text>
//                   ),
//                 },
//                 {
//                   id: 'action',
//                   title: (
//                     <Text as="span" alignment="end">
//                       Action
//                     </Text>
//                   ),
//                 },
//               ]}
//             >
//               {rowMarkup}
//             </IndexTable>
//           </Card>
//           <div className="sd-ultimate-option-AlertModal">
//             <Modal
//               open={reCheck}
//               onClose={() => setReCheck(false)}
//               title={"Delete Product ?"}
//               primaryAction={{
//                 content: "Delete",
//                 onAction: () => {
//                   setReCheck(false)
//                   handleDelete()
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
//                     Are you sure you want to delete this product from list? This can't
//                     be restored.
//                   </p>
//                 </BlockStack>
//               </Modal.Section>
//             </Modal>
//           </div>
//           {/* <div className="sd-ultimate-option-AlertModal">
//             <Modal
//               open={statusChange}
//               onClose={() => setStatusChange(false)}
//               title={"Want to change status?"}
//               primaryAction={{
//                 content: "Delete",
//                 onAction: () => {
//                   setStatusChange(false)
//                   // handleDelete()
//                 },
//               }}
//               secondaryActions={[
//                 {
//                   content: "Cancel",
//                   onAction: () => {
//                     setStatusChange(false);
//                   },
//                 },
//               ]}
//             >
//               <Modal.Section>
//                 <BlockStack gap={5}>
//                   <p>
//                     Are you sure you want to change status?
//                   </p>
//                 </BlockStack>
//               </Modal.Section>
//             </Modal>
//           </div> */}
//           {/* <Box paddingBlockStart={300}>
//             <DataTable
//               hasZebraStripingOnData
//               hoverable
//               stickyHeader
//               columnContentTypes={["text", "text", "text", "text"]}
//               headings={[
//                 <Text variant="headingSm" as="h6">
//                   Product Name
//                 </Text>,
//                 <Text variant="headingSm" as="h6">
//                   {" "}
//                  Total Inventory
//                 </Text>,
//                 <Text variant="headingSm" as="h6">
//                   {" "}
//                 Status
//                 </Text>,
//                 <Text variant="headingSm" alignment="center" as="h6">
//                   {" "}
//                 Action
//                 </Text>,
//               ]}
//               rows={rows}
//               verticalAlign="middle"
//             />
//           </Box> */}
//         </Page>
//       }
//     </>
//   )
// }
