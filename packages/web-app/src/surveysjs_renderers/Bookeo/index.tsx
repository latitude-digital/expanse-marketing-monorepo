import { ElementFactory, Question, Serializer, settings } from "survey-core";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";

import Calendar from '../../components/Calendar';
import Button from '../../components/Button';
import moment from 'moment-timezone';
import { createElement } from "react";
import { uniq } from 'lodash';

import style from './_index.module.scss';

const CUSTOM_TYPE = 'bookeo';

interface CustomIcons {
    [key: string]: string;
}

(settings.customIcons as CustomIcons)["icon-" + CUSTOM_TYPE] = "icon-calendar";

export class BookeoQuestionModel extends Question {
    constructor(name: string) {
        super(name);
    }

    getType() {
        return CUSTOM_TYPE;
    }

    //Trigger re-rendering
    onAnyValueChanged(name: string, questionName: string) {
        super.onAnyValueChanged(name, questionName);
        if (!!name && name === this.productQuestion) {
            console.log('productQuestion changed', this.data.getValue(name));
            this.setPropertyValue("productId", this.data.getValue(name));
        }
    }

    get seats(): number {
        return this.getPropertyValue("seats");
    }

    set seats(newValue: number) {
        this.setPropertyValue("seats", newValue);
    }

    get appOrWeb(): string {
        return this.getPropertyValue("appOrWeb");
    }

    set appOrWeb(newValue: string) {
        this.setPropertyValue("appOrWeb", newValue);
    }

    get timeZone(): string {
        return this.getPropertyValue("timeZone");
    }

    set timeZone(newValue: string) {
        this.setPropertyValue("timeZone", newValue);
    }

    get waitlist(): boolean {
        return this.getPropertyValue("waitlist");
    }

    set waitlist(newValue: boolean) {
        this.setPropertyValue("waitlist", newValue);
    }

    get productQuestion() {
        return this.getPropertyValue("productQuestion");
    }

    set productQuestion(val) {
        this.setPropertyValue("productQuestion", val);
    }

    get productId() {
        return !!this.survey && !!this.productQuestion ? this.data.getValue(this.productQuestion) : this.getPropertyValue("productId");
    }

    set productId(newValue: string) {
        this.setPropertyValue("productId", newValue);
    }

    get bookeoKey(): string {
        return this.getPropertyValue("bookeoKey");
    }

    set bookeoKey(newValue: string) {
        this.setPropertyValue("bookeoKey", newValue);
    }

    get customFieldId(): string {
        return this.getPropertyValue("customFieldId");
    }

    set customFieldId(newValue: string) {
        this.setPropertyValue("customFieldId", newValue);
    }
}

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
    return new BookeoQuestionModel(name);
});

Serializer.addClass(
    CUSTOM_TYPE,
    [
        {
            name: "appOrWeb",
            default: "web",
            choices: ["web", "app", "both"],
            category: "general",
            visibleIndex: 2 // Place after the Name and Title
        },
        {
            name: "bookeoKey",
            category: "general",
            visibleIndex: 3
        },
        {
            name: "customFieldId",
            category: "general",
            visibleIndex: 3
        },
        {
            name: "timeZone",
            category: "general",
            visibleIndex: 3
        },
        {
            name: "waitlist",
            category: "general",
            visibleIndex: 3
        },
        {
            name: "productQuestion",
            type: "question_selectbase",
            category: "general",
            visibleIndex: 4,
        },
        {
            name: "productId",
            category: "general",
            visibleIndex: 4
        },
        {
            name: "seats",
            category: "general",
            visibleIndex: 4
        },
    ],
    function () {
        return new BookeoQuestionModel("");
    },
    "question"
);

export class SurveyBookeoQuestion extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
        this.state = {
            isLoading: false,
            value: this.question.value,
            today: moment.tz(this.timeZone),
            startTime: moment.tz(this.timeZone).startOf('day').toISOString(),
            endTime: moment.tz(this.timeZone).endOf('day').add(30, 'days').toISOString(),
            selectedDate: null,
            availableDays: [],
            availableSlots: [],
            availabilityMessage: '',
            daySlots: [],
            slot: null,
            holdId: '',
            holdError: ''
        };

        this.getAvailability();
    }

    get question() {
        return this.questionBase;
    }

    get value() {
        return this.question.value;
    }

    get seats() {
        return this.question.seats;
    }

    set seats(newValue: number) {
        this.question.seats = newValue;
        this.getAvailability();
    }

    get appOrWeb() {
        return this.question.appOrWeb;
    }

    get timeZone() {
        return this.question.timeZone;
    }

    get waitlist() {
        return this.question.waitlist;
    }

    get productId() {
        return this.question.productId;
    }

    set productId(newValue: string) {
        this.question.productId = newValue;
        this.getAvailability();
    }

    get bookeoKey() {
        return this.question.bookeoKey;
    }

    set bookeoKey(newValue: string) {
        this.question.bookeoKey = newValue;
        this.getAvailability();
    }

    get customFieldId() {
        return this.question.customFieldId;
    }

    async getAvailability() {
        console.log('******getAvailability******');
        if (!this.question.bookeoKey) {
            return console.error('No Bookeo key provided', this.question.appOrWeb);
        }

        if (!this.question.productId) {
            return console.error('No product ID provided');
        };

        this.setState({ isLoading: true });
        fetch('https://us-central1-latitude-lead-system.cloudfunctions.net/getBookeoSlotsByProduct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: this.question.productId,
                startTime: this.state.startTime,
                endTime: this.state.endTime,
                seats: this.question.seats,
                bookeoKey: this.question.bookeoKey,
            }),
        }).then(response => {
            this.setState({ isLoading: false });
            response.json().then((data) => {
                if (!response.ok) {
                    return console.error('Bookeo API Error', data);
                }

                const daysFound = [];
                for (const slot of data.data) {
                    daysFound.push(moment.parseZone(slot.startTime).format('YYYY-MM-DD'));
                }
                this.setState({
                    availableSlots: data.data,
                    availableDays: uniq(daysFound),
                    availabilityMessage: '',
                });
                // updateField('custom_questions', {
                //     ...fields['custom_questions'],
                //     [labelKey]: productLabel,
                // });
                // updateField('bookeoInfo', '');
            });
        }).catch(err => {
            this.setState({ isLoading: false });
            console.error(err);
        });
    }

    setSelectedDate = (date: Date) => {
        this.setState({
            selectedDate: date,
            daySlots: this.state.availableSlots.filter(
                (slot: any) => moment.parseZone(slot.startTime).format('YYYY-MM-DD') === moment(date).format('YYYY-MM-DD')
            )
        });
    }

    setSelectedSlot = (slot: any) => {
        this.setState({ slot });
        const slotStartTime = moment.parseZone(slot.startTime);
        const slotEndTime = moment.parseZone(slot.endTime);
        this.question.value = {
            eventId: slot.eventId,
            startTime: slotStartTime.tz(this.timeZone).format('dddd MMM D, h:mm a'),
            endTime: slotEndTime.tz(this.timeZone).format('dddd MMM D, h:mm a'),
        }

        // reserve slot holdBookeoBooking
        fetch('https://us-central1-latitude-lead-system.cloudfunctions.net/holdBookeoBooking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                seats: this.question.seats,
                eventId: slot.eventId,
                productId: this.question.productId,
                previousHoldId: this.state.holdId,
                bookeoKey: this.question.bookeoKey,
            }),
        }).then(response => {
            this.setState({ isLoading: false });
            response.json().then((data) => {
                if (!response.ok) {
                    return console.error('Bookeo API Error', data);
                }

                this.setState({
                    holdId: data.id,
                    holdError: '',
                });

                this.question.value = {
                    ...this.question.value,
                    previousHoldId: data.id,
                }
            });
        }).catch(err => {
            this.setState({ isLoading: false });
            console.error(err);
        });
    }

    renderElement() {
        if (this.state.isLoading) {
            return (<div>Loading...</div>);
        }

        return (
            <>
                {
                    this.state.availableDays.length ?
                        <div className={style.booking_container}>
                            <div className={this.productId}>
                                <Calendar
                                    id={this.question.inputId}
                                    value={this.state.selectedDate}
                                    onChange={(date) => {
                                        this.setState({ selectedDate: undefined }, () => {
                                            this.setSelectedDate(date);
                                        });
                                    }}
                                    isDateAvailable={(date) => {
                                        const compareDate = moment(date).format('YYYY-MM-DD');
                                        return this.state.availableDays.includes(compareDate);
                                    }}
                                    focusedDate={moment(this.state.availableDays ? this.state.availableDays[0] : this.state.today).toDate()}
                                    min={moment(this.state.availableDays ? this.state.availableDays[0] : this.state.today).toDate()}
                                    max={moment(this.state.availableDays ? this.state.availableDays[this.state.availableDays.length - 1] : this.state.endTime).toDate()}
                                />
                            </div>
                            <div className={style.booking_button_container}>
                                {this.state.daySlots.map((slot: any) => (
                                    <Button
                                        key={slot.eventId}
                                        variant={this.state.slot?.eventId === slot.eventId ? "primary" : "secondary"}
                                        onClick={() => {
                                            this.setSelectedSlot(slot);
                                        }}
                                        className={style.booking_container_buttons}
                                    >
                                        {moment.parseZone(slot.startTime).tz(this.timeZone).format('h:mm a')}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        :
                        <div>No availability</div>
                }
            </>
        )
    }
}

ReactQuestionFactory.Instance.registerQuestion(CUSTOM_TYPE, (props) => {
    return createElement(SurveyBookeoQuestion, props);
});