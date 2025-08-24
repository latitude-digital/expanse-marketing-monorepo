import {onRequest} from "firebase-functions/v2/https";
import axios, {AxiosError, AxiosResponse, isAxiosError} from "axios";
import * as admin from "firebase-admin";

// Bookeo APIs
const bookeoBaseURL = "https://api.bookeo.com/v2";
const bookeoAPISecret = "J08GLvyBrggOwtjr0vsKroF0SxGqphkq";
const bookeoHeaders = {
  "content-type": "application/json",
};

// A list of all available products
export const getBookeoProductsImpl = (app: admin.app.App) => 
  onRequest({cors: true}, (req, res) => {
    const {bookeoKey} = req.body;

    const credentials =
      `?apiKey=${encodeURIComponent(bookeoKey)}` +
      `&secretKey=${encodeURIComponent(bookeoAPISecret)}`;

    axios
        .get(`${bookeoBaseURL}/settings/products/${credentials}`, {
          headers: bookeoHeaders,
        })
        .then((response: AxiosResponse) => {
          console.log("getProducts!!!!!", response.data);
          res.status(response.status || 200).send(response.data);
          return;
        })
        .catch((err: Error | AxiosError) => {
          if (isAxiosError(err)) {
            console.error(
                err.response?.status,
                err.response?.statusText,
                err.response?.data
            );
            res.status(err.response?.status || 500).send(err.response?.data);
          } else {
            res.status(500).send(JSON.stringify(err));
          }
          return;
        });
  });

// List of slots for a product & seats
export const getBookeoSlotsByProductImpl = (app: admin.app.App) => 
  onRequest({cors: true}, (req, res) => {
    const {productId, startTime, endTime, seats, bookeoKey} = req.body;

    const credentials =
      `?apiKey=${encodeURIComponent(bookeoKey)}` +
      `&secretKey=${encodeURIComponent(bookeoAPISecret)}`;
    const dataObject = {
      productId,
      startTime,
      endTime,
      peopleNumbers: [
        {
          peopleCategoryId: "Cadults",
          number: seats,
        },
      ],
    };

    axios
        .post(
            `${bookeoBaseURL}/availability/matchingslots${credentials}&itemsPerPage=300`,
            dataObject,
            {
              headers: bookeoHeaders,
            }
        )
        .then((response: AxiosResponse) => {
          console.log("getBookeoSlotsByProduct!!!!!", response.data);
          res.status(response.status || 200).send(response.data);
          return;
        })
        .catch((err: Error | AxiosError) => {
          if (isAxiosError(err)) {
            console.error(
                err.response?.status,
                err.response?.statusText,
                err.response?.data
            );
            res.status(err.response?.status || 500).send(err.response?.data);
          } else {
            res.status(500).send(JSON.stringify(err));
          }
          return;
        });
  });

export const holdBookeoBookingImpl = (app: admin.app.App) => 
  onRequest({cors: true}, (req, res) => {
    const {seats, eventId, productId, previousHoldId, bookeoKey} = req.body;

    const previousHoldIdParam = previousHoldId ?
      `&previousHoldId=${encodeURIComponent(previousHoldId)}` :
      "";
    const credentials =
      `?apiKey=${encodeURIComponent(bookeoKey)}` +
      `&secretKey=${encodeURIComponent(bookeoAPISecret)}${previousHoldIdParam}`;

    const dataObject = {
      eventId,
      productId,
      participants: {
        numbers: [
          {
            peopleCategoryId: "Cadults",
            number: seats,
          },
        ],
      },
    };

    axios
        .post(`${bookeoBaseURL}/holds${credentials}`, dataObject, {
          headers: bookeoHeaders,
        })
        .then((response: AxiosResponse) => {
          console.log("holdBookeoBooking!!!!!", response.data);
          res.status(response.status || 200).send(response.data);
          return;
        })
        .catch((err: Error | AxiosError) => {
          if (isAxiosError(err)) {
            console.error(
                err.response?.status,
                err.response?.statusText,
                err.response?.data
            );
            res.status(err.response?.status || 500).send(err.response?.data);
          } else {
            res.status(500).send(JSON.stringify(err));
          }
          return;
        });
  });

export const makeBookeoBookingImpl = (app: admin.app.App) => 
  onRequest({cors: true}, (req, res) => {
    const {
      seats,
      productId,
      eventId,
      firstName,
      lastName,
      bookeoKey,
      emailAddress,
      phone,
      type,
      previousHoldId,
      customData,
      customFieldId,
    } = req.body;

    let credentials =
      `?apiKey=${encodeURIComponent(bookeoKey)}` +
      `&secretKey=${encodeURIComponent(bookeoAPISecret)}` +
      "&mode=backend&notifyUsers=false&notifyCustomer=false";
    if (previousHoldId) {
      credentials += `&previousHoldId=${encodeURIComponent(previousHoldId)}`;
    }

    const dataObject = {
      eventId,
      productId,
      customer: {
        firstName,
        lastName,
        emailAddress,
        customFields: [
          {
            id: customFieldId,
            name: "notes",
            value: customData,
          },
        ],
        phoneNumbers: [
          {
            number: phone,
            type,
          },
        ],
      },
      participants: {
        numbers: [
          {
            peopleCategoryId: "Cadults",
            number: seats,
          },
        ],
      },
    };

    axios
        .post(`${bookeoBaseURL}/bookings${credentials}`, dataObject, {
          headers: bookeoHeaders,
        })
        .then((response: AxiosResponse) => {
          console.log("makeBookeoBooking!!!!!", response.data);
          res.status(response.status || 200).send(response.data || {});
          return;
        })
        .catch((err: Error | AxiosError) => {
          if (isAxiosError(err)) {
            console.error(
                err.response?.status,
                err.response?.statusText,
                err.response?.data
            );
            res.status(err.response?.status || 500).send(err.response?.data);
          } else {
            res.status(500).send(JSON.stringify(err));
          }
          return;
        });
  });