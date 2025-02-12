import nodemailer from 'nodemailer'
import { templateModel } from '../schema';
export async function sendOrderEmail(data) {
    // console.log("check data??",data)
    try {
        let template = await templateModel.findOne({shop: data?.shop}, {orderTemplate:1, shop: 1})
        console.log("template==", template)
        let interval=data?.billing_policy?.interval.toUpperCase()
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: "tpreet504@gmail.com",
                pass: "ftbx lpyi ygts otpg"
            },
        });

        const drawIdsList = data?.drawIds?.map((id) => `<tr>
                    <td>${data?.customerName}</td>
                    <td>${id}</td>
                </tr>`).join(" ");
                let html= template?.orderTemplate?.html?.replace('{{customerName}}', `${data?.customerName}`);
                html= html?.replace('{{productName}}', `${data?.products[0]?.productName}`);
                html= html?.replace('{{interval}}', `${interval=="ONETIME"? interval: interval+'LY'}`);
                html= html?.replace('{{drawIdsLength}}', `${data?.drawIds?.length}`);
                html= html?.replace('{{drawIdsList}}', `${drawIdsList}`);
                html= html?.replace('{{footer}}', `${template?.orderTemplate?.footer}`);
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
    // console.log("check apply mail data",data)
    try {

        let template = await templateModel.findOne({shop: data?.shop}, {appliedTemplate:1, shop: 1})
        console.log("template==", template)

        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: "tpreet504@gmail.com",
                pass: "ftbx lpyi ygts otpg"
            },
        });

        const drawIdsList = data?.drawIds?.map((id) => `<tr>
                    <td>${data?.customerName}</td>
                    <td>${id}</td>
                </tr>`).join(" ");

        let html= template?.appliedTemplate?.html?.replace('{{customerName}}', `${data?.customerName}`);
        html= html?.replace('{{orderId}}', `${data?.orderId}`);
        html= html?.replace('{{contractId}}', `${data?.contractId}`);
        html= html?.replace('{{drawIdsLength}}', `${data?.drawIds?.length}`);
        html= html?.replace('{{drawIdsList}}', `${drawIdsList}`);
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
    // console.log("check winner email data???",data)
    try {
        let template = await templateModel.findOne({shop: data?.shop}, {winningTemplate:1, shop: 1})
        console.log("template==", template, data?.billing_policy?.interval)
        console.log("data?.products[0]?.productName==",data?.products[0]?.productName)
        let interval=data?.billing_policy?.interval.toUpperCase()
        if(template){
        
            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: "tpreet504@gmail.com",
                    pass: "ftbx lpyi ygts otpg"
                },
            });
    
            // const drawIdsList = data?.drawIds?.map((id) => `<tr>
            //             <td>${data?.customerName}</td>
            //             <td>${id}</td>
            //         </tr>`).join(" ");
    
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












// html: `
//         <p>Hi ${data?.customerName || 'Sir/Mam'},</p>
        
//         <p>Your orderId is: ${data?.orderId}</p>
//         <p>Your contractId is: ${data?.contractId}</p>
//         <p>Your have ${data?.drawIds?.length} chances for winning</p>
//         <p>Here, the list of your ticket Entries which are applied for upcomming lucky draw.</p>
//         <table>
//             <thead>
//                 <tr>
//                     <th>Customer Name</th>
//                     <th>Entry Number</th>
//                 </tr>
//             </thead>
//             <tbody>
//             ${drawIdsList}
//             </tbody>
//         </table>
//            `,