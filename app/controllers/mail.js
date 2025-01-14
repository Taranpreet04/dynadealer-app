// const nodemailer = require("nodemailer");
import nodemailer from 'nodemailer'
export async function sendEmail(data) {
    // const { to, subject } = req.body;
        console.log("mail-data",data)
    try {
        // Create a transporter
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: "tpreet504@gmail.com",
                pass: "ftbx lpyi ygts otpg"
            },
        });

        // Email options
        const drawIdsList = data?.drawIds?.map((id) => `<tr>
                    <td>${data?.customer?.firstName || 'Rohit'} ${data?.customer?.lastName ||''}</td>
                    <td>${id}</td>
                </tr>`).join(" ");
        let mailOptions = {
            from: "Subscription App", // Sender's email
            to: data?.customer?.email, // Recipient's email
            subject: "Your order is successfully done", // Subject of the email
            html: `
        <p>Hi ${data?.customer?.firstName || ''} ${data?.customer?.lastName ||''},</p>
        <p>Thankyou for order.</p>
        <p>Your orderId is: ${data?.orderId}</p>
        <p>Your contractId is: ${data?.contractId}</p>
        <p>Your have ${data?.entries} chances for winning</p>
        <p>Your Ticket IDs are:</p>
        <table>
            <thead>
                <tr>
                    <th>Customer Name</th>
                    <th>Ticket Id</th>
                </tr>
            </thead>
            <tbody>
            ${drawIdsList}
            </tbody>
        </table>
           `,
        };

        // Send email
        await transporter.sendMail(mailOptions);
        return {
            success: true,
            result: "sent mail",
        };
        //   res.status(200).json({ message: "Email sent successfully!" });
    } catch (error) {
        console.error("Error sending email:", error);
        return {
            success: false,
            result: error,
        };
    }
}