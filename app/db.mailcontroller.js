import nodemailer from 'nodemailer'
import { subscriptionContractModel, templateModel } from './schema';
export async function sendOrderEmail(data) {
    try {
        let template = await templateModel.findOne({shop: data?.shop}, {orderTemplate:1, shop: 1})
       
        let interval=data?.billing_policy?.interval.toUpperCase()
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: "kyle@dynadealer.com",
                pass: "flux zfci tshc mfsm"
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

      let drawIdsList =  `<table>
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
                let html= template?.orderTemplate?.html?.replace('{{customerName}}', `${data?.customerName}`);
                html= html?.replace('{{productName}}', `${data?.products[0]?.productName}`);
                html= html?.replace('{{interval}}', `${interval=="ONETIME"? interval: interval+'LY'}`);
                html= html?.replace('{{drawIdsLength}}', `${data?.drawIds?.length}`);
                html= html?.replace('{{footer}}', `${template?.orderTemplate?.footer}`);
                html= html?.replace('{{drawIdsList}}', `${drawIdsList}`);
                html= html?.replace('{{rows}}', `${rows}`);
        let mailOptions = {
            from: "Membership App",
            to: data?.customerEmail,
            // to: 'taran@yopmail.com',
            subject: template?.orderTemplate?.subject,
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
export async function sendApplyEmail(data) {

    try {

        let template = await templateModel.findOne({shop: data?.shop}, {appliedTemplate:1, shop: 1})
      
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: "kyle@dynadealer.com",
                pass: "flux zfci tshc mfsm"
            },
        });

        let index= data?.ticketDetails?.appliedForDetail.length -1
        const rows = data?.ticketDetails?.appliedForDetail[index]?.appliedList.map((id) => `<tr>
        <td>${data?.customerName}</td>
        <td>${id}</td>
    </tr>`).join(" ");

      let drawIdsList =  `<table>
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

        let html= template?.appliedTemplate?.html?.replace('{{customerName}}', `${data?.customerName}`);
        html= html?.replace('{{orderId}}', `${data?.orderId}`);
        html= html?.replace('{{contractId}}', `${data?.contractId}`);
        html= html?.replace('{{productName}}', `${data?.ticketDetails?.appliedForDetail[index]?.productName}`);
        html= html?.replace('{{drawIdsLength}}', `${data?.ticketDetails?.appliedForDetail[index]?.appliedList?.length}`);
        html= html?.replace('{{drawIdsList}}', `${drawIdsList}`);
        html= html?.replace('{{rows}}', `${rows}`);
        html= html?.replace('{{footer}}', `${template?.appliedTemplate?.footer}`);
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
        let template = await templateModel.findOne({shop: data?.shop}, {winningTemplate:1, shop: 1})
        
        let interval=data?.billing_policy?.interval.toUpperCase()
        if(template){
        
            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: "kyle@dynadealer.com",
                    pass: "flux zfci tshc mfsm"
                },
            });
            let html= template?.winningTemplate?.html?.replace('{{customerName}}', `${data?.customerName}`);
            html= html?.replace('{{productName}}', `${data?.products[0]?.productName}`);
            html= html?.replace('{{interval}}', `${interval=="ONETIME"? interval: interval+'LY'}`);
            html= html?.replace('{{drawIdsLength}}', `${data?.drawIds?.length}`);
            html= html?.replace('{{footer}}', `${template?.winningTemplate?.footer}`);
            let mailOptions = {
                from: "Membership App",
                to: data?.customerEmail,
                subject: template?.winningTemplate?.subject,
                html: html,
            };
    
            await transporter.sendMail(mailOptions);
            console.log("Email sent successfully!")
            return {
                success: true,
                result: "Email sent successfully!",
            };
        }else{
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
// export async function raffleAnnouncementMail(data) {
 
//     try {
//         let template = await templateModel.findOne({shop:"virendertesting.myshopify.com"}, {announcementTemplate:1, shop: 1})
       
    
//             let transporter = nodemailer.createTransport({
//                 host: "smtp.gmail.com",
//                 port: 465,
//                 secure: true,
//                 auth: {
//                     user: "tpreet504@gmail.com",
//                     pass: "ftbx lpyi ygts otpg"
//                 },
//             });
    
//             let html= template?.announcementTemplate?.html?.replace('{{customerName}}', `${data?.customerName}`);
//                 html= template?.announcementTemplate?.html?.replace('{{productName}}', `${data?.title}`);
//             // html= html?.replace('{{interval}}', `${interval=="ONETIME"? interval: interval+'LY'}`);
//             // html= html?.replace('{{drawIdsLength}}', `${data?.drawIds?.length}`);
//             html= html?.replace('{{footer}}', `${template?.announcementTemplate?.footer}`);
//             let mailOptions = {
//                 from: "Membership App",
//                 to: data?.mailTo,
//                 subject: template?.announcementTemplate?.subject,
//                 html: html || `<h1>hello</h1>`,
//             };
                                                                                                                                                                      
//             await transporter.sendMail(mailOptions);
//             console.log("Email sent successfully!")
//             return {
//                 success: true,
//                 result: "Email sent successfully!",
//             };                      
//         // }else{
//         //     return {
//         //         success: false,
//         //         result: "no template found",
//         //     };
//         // }
//     } catch (error) {  
//         console.error("Error sending email:", error);
//         return {
//             success: false,
//             result: error,
//         }; 
//     }
// }

// export const sendMailToAll=async (admin, data)=>{
//     try{
//       const { shop } = admin.rest.session;
//       console.log("shop==", shop, data)
//       const contractData = await subscriptionContractModel.find(
//           { shop },{contractId: 1, orderId: 1, customerId: 1, customerEmail: 1}
//       );
//         const uniqueEmails = [
//           ...new Set(contractData.map(order => order.customerEmail))
//         ];
                                                                                                                                                                                                                                      
       
//         const mailTo = uniqueEmails.join(", ");                 
        
//           let detail= {...data, mailTo}
        
//           await raffleAnnouncementMail(detail)
//       return { message: "success" }
//     }catch(error){
//       console.error("Error processing POST request:", error);
//           return { message: "Error processing request", status: 500 };
//     }
//   }
