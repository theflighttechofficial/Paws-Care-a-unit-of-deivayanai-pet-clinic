# Google Calendar + Meet setup for Paws & Care

This project includes server-side Google Calendar integration support, but it will not create real Google events until the Google Cloud configuration is completed.

## 1) Create a Google Cloud project

1. Go to https://console.cloud.google.com/
2. Create or select a project.
3. Enable these APIs:
   - Google Calendar API
   - Google Meet is provided through the Calendar API when conference data is enabled.

## 2) Create a service account

1. In Google Cloud Console, open `IAM & Admin` -> `Service Accounts`.
2. Create a service account for the clinic.
3. Grant it at least:
   - `Editor` or equivalent Calendar permissions for the target calendar
4. Create a JSON key for this service account and download it.

## 3) Add the service account to your calendar

1. Open Google Calendar.
2. Create or open the clinic calendar.
3. Share the calendar with the service account email address.
4. Give it permission as `Make changes to events`.

## 4) Configure environment variables

Add these variables to the backend `.env` file in the project root:

```env
PORT=5000
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_secure_jwt_secret
CLINIC_TIMEZONE=Asia/Kolkata

GOOGLE_CLIENT_EMAIL=service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=your_calendar_email_or_calendar_id@group.calendar.google.com
```

Important:
- `GOOGLE_PRIVATE_KEY` must include escaped newline characters in `.env`.
- `GOOGLE_CALENDAR_ID` should be the email address of the Google Calendar to write into.

## 5) Restart the server

After saving the environment variables:

```bash
npm run server
```

## 6) Test the real integration

1. Log in as an owner.
2. Book an online consultation appointment.
3. The backend will attempt to create a real Google Calendar event with a Meet link.
4. If the backend returns `Google Calendar integration is not configured`, the required environment variables are still missing.
5. If the API throws an error, check the server logs for the exact Google API failure.

## 7) Safety behavior

The app is deliberately designed so that:
- normal booking still works,
- Google sync is optional,
- the app does not crash when Google is not configured,
- online appointments show a clear status instead of a fake Meet URL.

## Required before real testing

Before testing real Google Meet creation, complete these steps in Google Cloud Console:
- enable the Calendar API,
- create a service account,
- download the JSON key,
- grant the service account access to the clinic calendar,
- add the required `.env` values,
- restart the backend.

Once this is complete, the app can create real Google Calendar events and Google Meet URLs for online appointments.
