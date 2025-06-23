import { Resend } from 'resend';
import * as React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, react }) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(
      'RESEND_API_KEY is not set. Skipping email sending. Intended recipient:',
      to
    );
    // In a non-dev environment, you might want to throw an error
    // or handle this more gracefully. For now, we'll just log and exit.
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Campground <donotreply@mail.campground.creativeendurancelab.com>', // TODO: This should be a configured domain
      to,
      subject,
      react,
    });

    if (error) {
      console.error('Error sending email:', error);
      // Depending on the use case, you might want to throw the error
      // to be handled by the calling function.
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('An unexpected error occurred while sending email:', error);
    return { success: false, error };
  }
}; 