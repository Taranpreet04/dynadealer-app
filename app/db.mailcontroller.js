import nodemailer from 'nodemailer'
import twilio from 'twilio'
import CONFIGURATION from './config';
import { templateModel } from './schema';
export async function sendOrderEmail(data) {
    try {
        // console.log("data==", data)
        // console.log("data?.products[0]?.productName==", data?.products[0]?.productName)
        let template = await templateModel.findOne({ shop: data?.shop }, { orderTemplate: 1, shop: 1 })

        let interval = data?.billing_policy?.interval.toUpperCase()
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: CONFIGURATION?.emailUser,
                pass: CONFIGURATION?.emailPass
            },
            // auth: {
            //     user: "tpreet504@gmail.com",
            //     pass: "ftbx lpyi ygts otpg"
            // },
        });
        const rows = data?.drawIds?.map((id) => `<tr>
        <td>${data?.customerName}</td>
        <td>${id}</td>
    </tr>`).join(" ");

        let drawIdsList = `<table>
        <thead>   
            <tr>
                <th>Customer Name</th>
                <th>Entry Number</th>
            </tr>
        </thead>
        <tbody>
            {{rows}}                            
        </tbody>
    </table>`                            
        let html
        if (interval == "ONETIME") {
            html = template?.orderTemplate?.html?.replace('{{customerName}}', `${data?.customerName}`);
            html = html?.replace('{{productName}}', `${data?.products[0]?.productName}`);
            html = html?.replace('{{interval}}', `${interval == "ONETIME" ? interval : interval + 'LY'}`);
            html = html?.replace('{{drawIdsLength}}', `${data?.drawIds?.length}`);
            html = html?.replace('{{appliedForProduct}}', `${data?.ticketDetails?.appliedForDetail[0]?.productName}`);
            html = html?.replace('{{footer}}', `${template?.orderTemplate?.footer}`);
            html = html?.replace('{{drawIdsList}}', `${drawIdsList}`);
            html = html?.replace('{{rows}}', `${rows}`);
        } else {
            html = template?.orderTemplate?.monthlyHtml?.replace('{{customerName}}', `${data?.customerName}`);
            html = html?.replace('{{productName}}', `${data?.products[0]?.productName}`);
            html = html?.replace('{{interval}}', `${interval == "ONETIME" ? interval : interval + 'LY'}`);
            html = html?.replace('{{appliedForProduct}}', `${data?.ticketDetails?.appliedForDetail[0]?.productName}`);
            html = html?.replace('{{drawIdsLength}}', `${data?.drawIds?.length}`);
            html = html?.replace('{{footer}}', `${template?.orderTemplate?.footer}`);
            html = html?.replace('{{drawIdsList}}', `${drawIdsList}`);
            html = html?.replace('{{rows}}', `${rows}`);
        }

        let mailOptions = {
            from: "Membership App",
            to: data?.customerEmail,
            // to: 'taran@yopmail.com',
            subject: template?.orderTemplate?.subject,
            html: html,
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully!")

        const customerPhone = data?.customerPhone;
        if(customerPhone && customerPhone.length >= 10){

        const ticketList = data?.drawIds?.join(', ');
        const message = `Hi ${data?.customerName}, your order for ${data?.products[0]?.productName} is confirmed.
        Your tickets are applied for ${data?.ticketDetails?.appliedForDetail[0]?.productName}
        Tickets: ${ticketList}
        Total Tickets: ${data?.drawIds?.length}
        Thank you!`;
                             
        console.log("Customer phone before sending SMS:", data?.customerPhone);
        // console.log("Full data before sending SMS:", data);                                                                                       
        await sendSMS(
            data?.customerPhone?.startsWith('+') ? data.customerPhone : `+91${data.customerPhone}`,
            message
        );                                            
        console.log("SMS sent successfully!");
        return {
            success: true,
            result: "Email and sms sent successfully!",
        };
        }
    } catch (error) {
        console.error("Error sending email:", error);
        return {
            success: false,
            result: error,
        };
    }
}
export async function sendApplyEmail(data) {

    try {

        let template = await templateModel.findOne({ shop: data?.shop }, { appliedTemplate: 1, shop: 1 })

        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: CONFIGURATION?.emailUser,
                pass: CONFIGURATION?.emailPass
            },
        });

        let index = data?.ticketDetails?.appliedForDetail.length - 1
        const rows = data?.ticketDetails?.appliedForDetail[index]?.appliedList.map((id) => `<tr>
        <td>${data?.customerName}</td>
        <td>${id}</td>
    </tr>`).join(" ");

        let drawIdsList = `<table>
        <thead>
            <tr>
                <th>Customer Name</th>
                <th>Entry Number</th>
            </tr>
        </thead>
        <tbody>
            {{rows}}
        </tbody>
    </table>`                       

        let html = template?.appliedTemplate?.html?.replace('{{customerName}}', `${data?.customerName}`);
        html = html?.replace('{{orderId}}', `${data?.orderId}`);
        html = html?.replace('{{contractId}}', `${data?.contractId}`);
        html = html?.replace('{{productName}}', `${data?.ticketDetails?.appliedForDetail[index]?.productName}`);
        html = html?.replace('{{drawIdsLength}}', `${data?.ticketDetails?.appliedForDetail[index]?.appliedList?.length}`);
        html = html?.replace('{{drawIdsList}}', `${drawIdsList}`);
        html = html?.replace('{{rows}}', `${rows}`);
        html = html?.replace('{{footer}}', `${template?.appliedTemplate?.footer}`);
        let mailOptions = {
            from: "Membership App",
            to: data?.customerEmail,
            subject: template?.appliedTemplate?.subject,
            html: html,
        };
         
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully!")
        return {
            success: true,
            result: "Email sent successfully!",
        };
    } catch (error) {
        console.error("Error sending email:", error);
        return {    
            success: false,
            result: error,
        };
    }
}
export async function sendWinnerEmail(data) {

    try {
        let template = await templateModel.findOne({ shop: data?.shop }, { winningTemplate: 1, shop: 1 })

        let interval = data?.billing_policy?.interval.toUpperCase()
        if (template) {

            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: CONFIGURATION?.emailUser,
                    pass: CONFIGURATION?.emailPass
                },
            });
            let html = template?.winningTemplate?.html?.replace('{{customerName}}', `${data?.customerName}`);
            html = html?.replace('{{productName}}', `${data?.products[0]?.productName}`);
            html = html?.replace('{{interval}}', `${interval == "ONETIME" ? interval : interval + 'LY'}`);
            html = html?.replace('{{drawIdsLength}}', `${data?.drawIds?.length}`);
            html = html?.replace('{{footer}}', `${template?.winningTemplate?.footer}`);
            let mailOptions = {
                from: "Membership App",
                to: data?.customerEmail,
                subject: template?.winningTemplate?.subject,
                html: html,
            };

            await transporter.sendMail(mailOptions);
            console.log("Email sent ti winner successfully!")
            return {
                success: true,
                result: "Email sent successfully!",
            };
        } else {
            return {
                success: false,
                result: "no template found",
            };
        }
    } catch (error) {
        console.error("Error sending email:", error);
        return {
            success: false,
            result: error,
        };
    }
}

export async function cancelContractMail(data){
    console.log("cancelContractMail called", data);
    try{
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth:{
                user: CONFIGURATION?.emailUser,
                pass: CONFIGURATION?.emailPass,
            }
        })

        const cancelDate = new Date().toLocaleDateString();
          
        const html =`
            <div style="line-height: 1.5;">
                <h2>Subscription Cancelled</h2>

                <p>Hi Kyle,</p>
                <p>We wanted to inform you that  <strong> ${data?.customerName}'s </strong> subscription for the <strong>${data?.productName}</strong> has been successfully cancelled as of <strong>${cancelDate}</strong>. </p>
                <p>Thank you,<br />Team Membership App</p>
            </div>                          
        `;                              
        let mailOptions = {
            from: "Membership App",
             to: CONFIGURATION?.emailUser,
            //   to: data?.customerEmail,
            subject: `${data?.customerName}'s  subscription has been cancelled`,
            html: html, 
        }

         
        await transporter.sendMail(mailOptions);
        console.log("cancel membersship email sent");
        return{
            success: true,
            result: "Cancel membership email sent successfully"
        };
    }catch (error){
        console.log("error sending cancel mail",error);
        return{
            success:false,
            result:error
        };
    }
}

const accountSid = CONFIGURATION?.accountSid;
const authToken = CONFIGURATION?.authToken;
const twillioPhone= CONFIGURATION?.twillioPhone
const client = twilio(accountSid, authToken);

export async function sendSMS(to, message) {
    console.log("SMS to====>",to)
    try {
        const result = await client.messages.create({
            body: message,
            from: CONFIGURATION?.twillioPhone,
            to: to
        });
        console.log("message SID", result.sid);
        console.log("Full Twilio SMS Result:", result);
        return result;                                      
    } catch (error) {
        console.log("SMS failed", error);
        throw error
    }
}