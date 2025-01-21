import nodemailer from 'nodemailer'
export async function sendEmail(data) {
    try {
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
        let mailOptions = {
            from: "Subscription App",
            to: data?.customerEmail,
            subject: "Your order is successfully done",
            html: `
        <p>Hi ${data?.customerName || 'Sir/Mam'},</p>
        <p>Thankyou for order.</p>
        <p>Your orderId is: ${data?.orderId}</p>
        <p>Your contractId is: ${data?.contractId}</p>
        <p>Your have ${data?.drawIds?.length} chances for winning</p>
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