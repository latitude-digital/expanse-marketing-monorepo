import { UAParser } from "ua-parser-js";
import { Timestamp } from "@firebase/firestore/lite";

const parser = new UAParser(window.navigator.userAgent);

export default class SurveyResponse {
    eventID: string;
    startTime: Timestamp;
    endTime?: Timestamp;
    userID?: string;
    installationID: string;
    appName: string;
    appVersion: string;
    appBuildVersion: string;
    modelName?: string;
    deviceName?: string;
    osVersion?: string;
    answers: Record<string, any>;

    constructor(q:any) {
        const {
            eventID,
            userID,
            ...answers
        } = q

        const ua = parser.getResult();

        this.eventID = eventID;
        this.startTime = Timestamp.now();
        this.userID = userID;
        this.installationID = ua.ua;
        this.appName = process.env.REACT_APP_NAME!;
        this.appVersion = '1.0';
        this.appBuildVersion = process.env.REACT_APP_VERSION!;
        this.modelName = ua.device.model;
        this.deviceName = ua.os.name;
        this.osVersion = ua.os.version;
        this.answers = {...answers};
    }

    endSurvey():void {
        this.endTime = Timestamp.now();
    }

    toFirestore():Record<string, any> {
        const returnObjectTemp = {
            ...this.answers,
            ...this,
        }

        const {answers, ...returnObject} = returnObjectTemp;

        return returnObject;
    }
}
