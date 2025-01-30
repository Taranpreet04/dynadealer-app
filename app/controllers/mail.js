import nodemailer from 'nodemailer'
export async function sendOrderEmail(data) {
    try {
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
        let mailOptions = {
            from: "Membership App",
            to: data?.customerEmail,
            subject: "Your order is successfully done",
            html: `
        <p>Hi ${data?.customerName || 'Sir/Mam'},</p>
        <p>Thankyou to order for <b>${data?.products[0]?.productName}</b> which is your${' '}
        <b>${interval=='ONETIME'? interval: interval+ "LY"}</b> plan.</p>
        <p>Your have ${data?.drawIds?.length} chances for winning<./p>
        <p>Your Entry Numbers are:</p>
        <table>
            <thead>
                <tr>
                    <th>Customer Name</th>
                    <th>Entry Number</th>
                </tr>
            </thead>
            <tbody>
            ${drawIdsList}
            </tbody>
        </table>
        <p>Note: You must apply for tickets through the customer portal; otherwise, they will not be included in the lucky draw listing.</p>
           <p>Steps to apply for tickets-</p>
           <li>First Login to your customer portal.</li>
           <li>Then click on Mange Memberships box.</li>
           <li>Now you will able to see your orders list.</li>
           <li>Each order has a view icon that you need to click on it and apply your tickets to getting chances for lucky draws</li>
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
export async function sendApplyEmail(data) {
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
            from: "Membership App",
            to: data?.customerEmail,
            subject: "Your tickets are applied succesfully.",
            html: `
        <p>Hi ${data?.customerName || 'Sir/Mam'},</p>
        
        <p>Your orderId is: ${data?.orderId}</p>
        <p>Your contractId is: ${data?.contractId}</p>
        <p>Your have ${data?.drawIds?.length} chances for winning</p>
        <p>Here, the list of your ticket Entries which are applied for upcomming lucky draw.</p>
        <table>
            <thead>
                <tr>
                    <th>Customer Name</th>
                    <th>Entry Number</th>
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