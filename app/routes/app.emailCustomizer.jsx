// import nodemailer from 'nodemailer'
import {
    Page,
    Button,
    Card,
    Text,
    Grid,
    TextField,
    BlockStack,
    InlineGrid,
    Tabs,
    Collapsible,
    InlineStack,
    DescriptionList,
    Divider,
    Select,
    Modal
} from '@shopify/polaris';
import React, { useState, useCallback, useEffect } from 'react';
import {
    BtnBold,
    BtnItalic,
    BtnUnderline,
    BtnBulletList,
    BtnNumberedList,
    BtnLink,
    BtnStrikeThrough,
    BtnStyles,
    BtnRedo,
    BtnUndo,
    BtnClearFormatting,
    Editor,
    EditorProvider,
    Toolbar
} from 'react-simple-wysiwyg';
import { getEmailTemplate, getAllContracts, updateTemplate, updateDocument} from '../controllers/planController';
import { sendWinnerEmail } from '../db.mailcontroller'
import { authenticate } from '../shopify.server';
import { useActionData, useLoaderData, useSubmit } from '@remix-run/react';

export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    await updateDocument(admin)
    let contractData = await getAllContracts(admin)
    let data = await getEmailTemplate(admin)
    return {
        data: data?.data,
        contractDetails: contractData?.details
    };
}

export default function EmailCustomizer() {
    const [templates, setTemplates] = useState({})
    const [tabSelected, setTabSelected] = useState(0);
    const loaderData = useLoaderData();
    const actionData = useActionData();
    const [open, setOpen] = useState(true);
    const [btnLoader, setBtnLoader] = useState(false);
    const [mailBtnLoader, setMailBtnLoader] = useState(false);
    const [contracts, setContracts] = useState([]);
    const [winnerAccount, setWinnerAccount] = useState([]);
    const [orderTemplateFor, setOrderTemplateFor] = useState('onetime');
    const [reCheckWinner, setReCheckWinner] = useState(false);
    const submit = useSubmit()
    useEffect(() => {
     
        if (loaderData) {
            setTemplates(loaderData?.data)
            let details = []
            loaderData?.contractDetails?.map((itm) => {
                details?.push({
                    label: `${itm?.customerName} (${itm?.orderId})`,
                    value: `${itm?.customerName} (${itm?.orderId})`
                })
            })
            setWinnerAccount(details[0]?.value)
            setContracts(details)
        }
    }, [loaderData])
    useEffect(() => {
        console.log("actionData==", actionData)
        if (actionData) {
            setBtnLoader(false)
            setMailBtnLoader(false)
            if(actionData?.success && actionData?.result){
                shopify.toast.show(actionData?.result)
            }
        }
    }, [actionData])
    const handleEditorChange = (e) => {
     
        let data = templates
        tabSelected == 0 && orderTemplateFor=='onetime'?
            (data.orderTemplate.html = e.target.value)
            :tabSelected == 0 && orderTemplateFor=='month'?
            (data.orderTemplate.monthlyHtml = e.target.value)
            : tabSelected == 1 ? (data.appliedTemplate.html = e.target.value)
                : tabSelected == 2 ? (data.winningTemplate.html = e.target.value)
                    : tabSelected == 3 ? (data.announcementTemplate.html = e.target.value) : ''
        setTemplates({ ...data })
    }
    const handleChange = (val, key) => {
        let data = templates
        tabSelected == 0 ?
            (data.orderTemplate[key] = val)
            : tabSelected == 1 ? (data.appliedTemplate[key] = val)
                : tabSelected == 2 ? (data.winningTemplate[key] = val)
                    : tabSelected == 3 ? (data.announcementTemplate[key] = val) : ''
        setTemplates({ ...data })
    }
    const tabMenu = [
        {
            id: 'orderConfirm',
            content: 'Order Confirm Email Template',
            accessibilityLabel: 'orderConfirm',
        },
        {
            id: 'applied',
            content: 'Applied Tickets Email Template',
            accessibilityLabel: 'applied',
        },
        {
            id: 'winning',
            content: 'Winning Email Template',
            accessibilityLabel: 'winning',
        },
        {
            id: 'announcement',
            content: 'Raffle Announcement Email Template',
            accessibilityLabel: 'announcement',
        },
    ];
    const handleTabSelect = useCallback((index) => {
        setTabSelected(index)
    }, []);
    const handleToggle = useCallback(() => setOpen((open) => !open), []);

    const handleSave = () => {
        setBtnLoader(true)
        let formData = {
            ...templates,
            orderTemplate: JSON.stringify(templates?.orderTemplate),
            appliedTemplate: JSON.stringify(templates?.appliedTemplate),
            winningTemplate: JSON.stringify(templates?.winningTemplate),
            announcementTemplate: JSON.stringify(templates?.announcementTemplate),
        }
        submit(formData, {
            method: "post"
        })
    }

    const sendWinnerMail = () => {
        setReCheckWinner(false)
        let winnerDetail = loaderData?.contractDetails?.find(itm => winnerAccount == `${itm?.customerName} (${itm?.orderId})`)
        console.log("winnerDetail==", winnerDetail)
        let formData = {
            ...winnerDetail,
            winner: true,
            products: JSON.stringify(winnerDetail?.products),
            drawIds: JSON.stringify(winnerDetail?.drawIds),
            billing_policy: JSON.stringify(winnerDetail?.billing_policy),
        }
     
        submit(formData, {
            method: "post"
        })
    }
    return (
        <Page
            title="Email customizer"
            primaryAction={<Button variant="primary" loading={btnLoader}
                onClick={handleSave}>Save</Button>}
        >
            <Grid>
                <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
                    <Tabs fitted tabs={tabMenu} selected={tabSelected} onSelect={handleTabSelect} />
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
                    <Card sectioned>
                        <BlockStack>
                            <InlineStack align='space-between'>
                                <Text as="h2" variant="headingSm">
                                    Parameters
                                </Text>
                                <Divider />
                                <Button
                                    onClick={handleToggle}
                                    ariaExpanded={open}
                                    ariaControls="basic-collapsible"
                                >
                                    {open ? "Collapse" : "Expand"}
                                </Button>
                            </InlineStack>
                            <Collapsible
                                open={open}
                                id="basic-collapsible"
                                transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                expandOnPrint
                            >
                                <DescriptionList
                                    items={tabSelected == 0 ?
                                        templates?.orderTemplate?.orderMailParameters || []
                                        : tabSelected == 1 ? templates?.appliedTemplate?.appliedMailParameters || []
                                            : tabSelected == 2 ? templates?.winningTemplate?.winnerMailParameters || []
                                            : tabSelected == 3 ? templates?.announcementTemplate?.announcementMailParameters || [] : []}
                                />
                            </Collapsible>
                        </BlockStack >
                    </Card>
                </Grid.Cell>

                <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
                    <Card title="Credit card" sectioned>
                        <InlineGrid gap='400'>
                            <Text as="h2" variant="headingSm">
                                Settings
                            </Text>
                           { tabSelected == 0 &&
                            <Select
                                        label="Choose body for"
                                        options={[
                                            {label:'Onetime', value: 'onetime'},
                                            {label:'Monthly', value: 'month'}
                                        ]}
                                        value={orderTemplateFor}
                                        onChange={(value) => setOrderTemplateFor(value)}
                                    />
                           }
                            <TextField
                                label="Email Subject"
                                value={tabSelected == 0 ? templates?.orderTemplate?.subject
                                    : tabSelected == 1 ? templates?.appliedTemplate?.subject
                                        : tabSelected == 2 ? templates?.winningTemplate?.subject 
                                        : tabSelected == 3 ? templates?.announcementTemplate?.subject : ''}
                                onChange={(value) => handleChange(value, 'subject')}
                                autoComplete="off"
                            />
                            <TextField
                                label="Email Footer"
                                value={tabSelected == 0 ? templates?.orderTemplate?.footer
                                    : tabSelected == 1 ? templates?.appliedTemplate?.footer
                                        : tabSelected == 2 ? templates?.winningTemplate?.footer 
                                        : tabSelected == 3 ? templates?.announcementTemplate?.footer : ''}
                                onChange={(value) => handleChange(value, 'footer')}
                                autoComplete="off"
                                multiline={4}
                            />
                            {tabSelected == 2 &&
                                <BlockStack gap='400'>
                                    <Select
                                        label="Select Winner"
                                        options={contracts}
                                        value={winnerAccount}
                                        onChange={(value) => setWinnerAccount(value)}
                                    />
                                    <Button variant="primary" loading={mailBtnLoader}
                                        onClick={() => setReCheckWinner(true)}>Send Mail To Winner</Button>
                                </BlockStack>}

                        </InlineGrid>

                    </Card>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 8, md: 8, lg: 8, xl: 8 }}>
                    <Card title="Credit card" sectioned>
                        <Text as="h2" variant="headingSm">
                            Email Body
                        </Text>
                        <EditorProvider>
                            <Editor
                                value={tabSelected == 0 && orderTemplateFor=='onetime' ? templates?.orderTemplate?.html
                                    :tabSelected == 0 && orderTemplateFor=='month' ? templates?.orderTemplate?.monthlyHtml
                                    : tabSelected == 1 ? templates?.appliedTemplate?.html
                                        : tabSelected == 2 ? templates?.winningTemplate?.html 
                                        : tabSelected == 3 ? templates?.announcementTemplate?.html : ''}
                                onChange={(e) => handleEditorChange(e)}
                            >
                                <Toolbar>
                                    <BtnBold />
                                    <BtnItalic />
                                    <BtnUnderline />
                                    <BtnBulletList />
                                    <BtnNumberedList />
                                    <BtnLink />
                                    <BtnStrikeThrough />
                                    <BtnRedo />
                                    <BtnStyles />
                                    <BtnUndo />
                                    <BtnClearFormatting />
                                </Toolbar>
                            </Editor>
                        </EditorProvider>
                    </Card>
                </Grid.Cell>
            </Grid>
            <div className="sd-ultimate-option-AlertModal">
                <Modal
                    open={reCheckWinner}
                    onClose={() => setReCheckWinner(false)}
                    title={"Winner"}
                    primaryAction={{
                        content: "Yes",
                        onAction: () => {
                            sendWinnerMail()
                        },
                    }}
                    secondaryActions={[
                        {
                            content: "No",
                            onAction: () => {
                                setReCheckWinner(false)
                            },
                        },
                    ]}
                >
                    <Modal.Section>
                        <BlockStack gap={5}>
                            <p>
                                Are you sure that winner is {winnerAccount} ?
                            </p>
                        </BlockStack>
                    </Modal.Section>
                </Modal>
            </div>
        </Page>
    )
}



export const action = async ({ request }) => {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();
    let data = Object.fromEntries(formData);
    let res
    if (data?.winner) {
        data = {
            ...data,
            products: JSON.parse(data?.products),
            drawIds: JSON.parse(data?.drawIds),
            billing_policy: JSON.parse(data?.billing_policy),
        }
        res = await sendWinnerEmail(data)
    }
    else {
        data = {
            ...data,
            orderTemplate: JSON.parse(data?.orderTemplate),
            appliedTemplate: JSON.parse(data?.appliedTemplate),
            winningTemplate: JSON.parse(data?.winningTemplate),
            announcementTemplate: JSON.parse(data?.announcementTemplate),
        }
        res = await updateTemplate(admin, data)
    }
    return res;
}
