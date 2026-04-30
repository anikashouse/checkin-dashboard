IMPORTANT INFORMATION:

This is going to be a platform for users to sign up and be able to manage checkins of their properties:

- Sign up and sign in functionallity. 
- Connection to supabase to store data. 
- When first user sign up, screen with setup onboarding, letting it choose:
  - Set up properties, or skip for now. 
  - Set up services: Ex: Telegram, email, drive, etc. And the setup credentials for each. or skip for now. 
- Once in dashboard, there is going to be a left menu, with:
  - Properties
    - Cama doble ("Property 1)
    - 12 minutes ("Porperty 2)
    - etc if there is more properties. 
  - _____
  - Resumen - Which loads a page with: 
    - Calendar (With all the reserves of all properties, each property one color.)
    - Properties ( With a resume of the properties)
    - A list of all reserves of all properties as a resume. 
  - In each property on left menu, enters to a detailed page of the property with: 
    - Calendar of all the reserves. 
    - List of all reserves. With the Code of the reserve, and the checkin checkout dates, organized from earlier to later.
    (Each reserve is clickable and it enters to a page with all the details of the reserve, and the option to edit it.)

THE INTENTION OF ALL THIS IS TO BE ABLE TO MANAGE ALL CHECKINS OF THE CLIENTS, IN ORDER TO SEND THEM A LINK WITH THE REPO (AIRBNB_CHECKIN) AND BE ABLE TO RECOLLECT THE DATA TO SEND TO MOSSOS FROM THEIR SUSCRIPTION TO THE FORM.

- So in details of each reserve, there is going to be a button to send the data to Mossos, which is going to send the data to Mossos with the API, and then change the status of the reserve to "Sent to Mossos" or something like that.
We will recollect the data from the form, create the .txt file required by Mossos, making sure all is filled up correctly, and then send it to Mossos with the API.
I want to have 3 indicators of the status of the reserve:
- Form filled up correctly (Green if all is correct, red if there is something missing or incorrect)
- Txt file created. And the acccess to this file, with a button to download it. Also maybe to upload it. Make sure this is stored into the database to have always access. 
- Sent to Mossos. Green if sent, red if not sent. Also with the .pdf comprobante that Mossos gives you when you send the data, and the access to this file, with a button to download it. Also maybe to upload it. Make sure this is stored into the database to have always access.

- In the dashboard, there is also going to be a section to manage the services, where the user can see all the services they have connected, and edit the credentials or disconnect them.

- In the onboarding, when the user sets up the services, there is going to be a section for each service, where they can input the credentials and connect them. For example, for Telegram, they would input the bot token and connect it. For email, they would input the email address and password and connect it. For drive, they would input the credentials to connect to their drive.

- In the properties section, when the user clicks on a property, they can see all the details of the property, and also edit them. For example, they can change the name of the property, the address, etc. ALSO ADD A NEW ONE. 

- In the reserves section of each property, when the user clicks on a reserve, they can see all the details of the reserve, and also edit them. 

- In the resumen section, there is going to be a calendar that shows all the reserves of all properties, with each property in a different color. There is also going to be a section that shows a resume of all the properties, with the number of reserves, and the status of each reserve. There is also going to be a list of all reserves of all properties, organized from earlier to later, with the code of the reserve, the checkin and checkout dates, and the status of the reserve.

- In bottom left in user login, i want to have a logout button. 


with both repos airbnb_checkin and checkin-dashboard, So the path forward is: don't merge yet, but architect the dashboard to eventually absorb the guest portal functionality.


Pon los estados de reserva en calendario tambien

cuando haya la info del huesped, solo muestra apellido. 