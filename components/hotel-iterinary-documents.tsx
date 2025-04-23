import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { format } from "date-fns";
import Logo from "@/public/images/XpressTravel.png";

// Define TypeScript interfaces
interface BookingDates {
    checkIn: Date | null;
    checkOut: Date | null;
    nights: number;
}

interface AdditionalGuest {
    title?: string;
    firstName?: string;
    lastName?: string;
    special_needs?: string;
}

interface HotelBooking {
    reference_no?: string | null;
    date_booked_request?: string | null;
    hotel_name?: string | null;
    booking_id?: string | null;
    hotel_address?: string | null;
    hotel_contact?: string | null;
    check_in_date?: string | null;
    check_out_date?: string | null;
    room_type?: string | null;
    number_of_rooms?: string | number | null;
    number_of_guests?: string | number | null;
    meal_plan?: string | null;
    special_requests?: string | null;
    title?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email_client?: string | null;
    contact_number_client?: string | null;
    special_needs?: string | null;
    room_rate_per_night?: string | number | null;
    selling_price?: string | number | null;
    taxes_and_fees?: string | number | null;
    payment_status?: string | null;
    travel_agency_name?: string | null;
    travel_agency_address?: string | null;
    contact_number_merchant?: string | null;
    social_media_page?: string | null;
}

interface HotelItineraryDocumentProps {
    booking: HotelBooking;
    bookingDates: BookingDates;
    additionalGuests?: AdditionalGuest[];
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    travelLogoUrl?: string | null; // Added property for custom travel logo
}

// Define the styles
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: "Helvetica",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: "column",
    },
    headerText: {
        fontSize: 12,
        marginBottom: 5,
    },
    logo: {
        width: 100,
        height: 50,
        objectFit: "contain",
    },
    bookingInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottom: 1,
        borderBottomColor: "#000",
        paddingBottom: 10,
        marginBottom: 10,
    },
    bookingReference: {
        fontSize: 14,
        fontWeight: "bold",
    },
    bookingDate: {
        fontSize: 14,
    },
    itineraryTitle: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 15,
    },
    clientHeader: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 5,
    },
    clientInfo: {
        fontSize: 12,
        marginBottom: 20,
        padding: 10,
        backgroundColor: "#f8f8f8",
        borderRadius: 5,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        backgroundColor: "#00f5ff",
        padding: 8,
        marginBottom: 10,
    },
    hotelName: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
    },
    hotelAddress: {
        fontSize: 12,
        marginBottom: 10,
    },
    hotelDetails: {
        fontSize: 12,
        marginBottom: 5,
    },
    section: {
        marginBottom: 20,
        borderBottom: 1,
        borderBottomColor: "#e5e5e5",
        paddingBottom: 15,
    },
    infoRow: {
        flexDirection: "row",
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: "bold",
        width: "30%",
    },
    infoValue: {
        fontSize: 12,
        width: "70%",
    },
    guestTable: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#00f5ff",
        padding: 8,
        fontSize: 12,
        fontWeight: "bold",
    },
    tableRow: {
        flexDirection: "row",
        padding: 8,
        borderBottom: 1,
        borderBottomColor: "#e5e5e5",
        fontSize: 12,
    },
    nameColumn: {
        width: "50%",
    },
    typeColumn: {
        width: "25%",
    },
    specialColumn: {
        width: "25%",
    },
    paymentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 5,
    },
    paymentLabel: {
        fontSize: 12,
    },
    paymentValue: {
        fontSize: 12,
        fontWeight: "bold",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
        paddingTop: 8,
        borderTop: 1,
        borderTopColor: "#e5e5e5",
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: "bold",
    },
    totalValue: {
        fontSize: 14,
        fontWeight: "bold",
    },
    importantSection: {
        marginTop: 15,
    },
    importantTitle: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 10,
    },
    noteItem: {
        flexDirection: "row",
        marginBottom: 10,
    },
    dotPoint: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#000",
        marginRight: 8,
        marginTop: 6,
    },
    noteText: {
        fontSize: 10,
        flex: 1,
        lineHeight: 1.5,
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: "center",
        fontSize: 10,
        color: "#666",
        borderTop: 1,
        borderTopColor: "#e5e5e5",
        paddingTop: 10,
    },
});

// Format currency helper - FIXED to use proper text-based Philippine Peso symbol
const formatCurrency = (amount: string | number | null | undefined): string => {
    if (amount === null || amount === undefined) return "PHP 0.00";
    const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return `PHP ${numericAmount.toFixed(2)}`;
};

// Hotel Itinerary Document Component
const HotelItineraryDocument: React.FC<HotelItineraryDocumentProps> = ({
    booking,
    bookingDates,
    additionalGuests = [],
    title,
    author,
    subject,
    keywords,
    creator,
    producer,
    travelLogoUrl, // Added parameter for custom travel logo
}) => {
    // Calculate number of nights
    const nightsStay = bookingDates?.nights || 0;

    return (
        <Document
            title={title || `Hotel Itinerary - ${booking.reference_no}`}
            author={author || "PHILTECH XPRESS Travels"}
            subject={subject || "Hotel Booking Confirmation"}
            keywords={keywords || "itinerary, hotel, booking"}
            creator={creator || "XPRESS Booking System"}
            producer={producer || "PHILTECH XPRESS Travels"}
        >
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerText}>Agency Name: {booking.travel_agency_name || "XpressTravel"}</Text>
                        <Text style={styles.headerText}>Address: {booking.travel_agency_address || "Main Office"}</Text>
                        <Text style={styles.headerText}>Mobile No: {booking.contact_number_merchant || "N/A"}</Text>
                        <Text style={styles.headerText}>Channel: PHILTECH XPRESS TRAVEL</Text>
                    </View>
                    <Image src={travelLogoUrl || Logo.src} style={styles.logo} />
                </View>

                {/* Booking Information */}
                <View style={styles.bookingInfo}>
                    <Text style={styles.bookingReference}>Booking Reference No: {booking.reference_no || "N/A"}</Text>
                    <Text style={styles.bookingDate}>
                        Booked On:{" "}
                        {booking.date_booked_request
                            ? format(new Date(booking.date_booked_request), "MMMM dd, yyyy")
                            : format(new Date(), "MMMM dd, yyyy")}
                    </Text>
                </View>

                <Text style={styles.itineraryTitle}>HOTEL ACCOMMODATION ITINERARY</Text>

                {/* Client Information */}
                <Text style={styles.clientHeader}>Guest Information:</Text>
                <View style={styles.clientInfo}>
                    <Text>{booking.title || ""} {booking.first_name || ""} {booking.last_name || ""}</Text>
                    <Text>Email: {booking.email_client || "N/A"}</Text>
                    <Text>Contact Number: {booking.contact_number_client || "N/A"}</Text>
                </View>

                {/* Hotel Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>HOTEL DETAILS</Text>
                    <Text style={styles.hotelName}>Hotel Name: {booking.hotel_name || "N/A"}</Text>
                    <Text style={styles.hotelAddress}>Hotel Address: {booking.hotel_address || "N/A"}</Text>
                    <Text style={styles.hotelDetails}>Phone: {booking.hotel_contact || "N/A"}</Text>
                    <Text style={styles.hotelDetails}>Booking ID: {booking.booking_id || "N/A"}</Text>
                </View>

                {/* Stay Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>RESERVATION DETAILS</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Check-in:</Text>
                        <Text style={styles.infoValue}>
                            {bookingDates?.checkIn
                                ? format(bookingDates.checkIn, "EEEE, MMMM dd, yyyy")
                                : booking.check_in_date
                                    ? format(new Date(booking.check_in_date), "EEEE, MMMM dd, yyyy")
                                    : "N/A"} (After 2:00 PM)
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Check-out:</Text>
                        <Text style={styles.infoValue}>
                            {bookingDates?.checkOut
                                ? format(bookingDates.checkOut, "EEEE, MMMM dd, yyyy")
                                : booking.check_out_date
                                    ? format(new Date(booking.check_out_date), "EEEE, MMMM dd, yyyy")
                                    : "N/A"} (Before 12:00 PM)
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Duration:</Text>
                        <Text style={styles.infoValue}>{nightsStay} night{nightsStay !== 1 ? 's' : ''}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Room Type:</Text>
                        <Text style={styles.infoValue}>{booking.room_type || "Standard Room"}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Number of Rooms:</Text>
                        <Text style={styles.infoValue}>{booking.number_of_rooms || "1"}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Guests:</Text>
                        <Text style={styles.infoValue}>{booking.number_of_guests || "1"} person{booking.number_of_guests !== 1 ? 's' : ''}</Text>
                    </View>

                    {booking.special_requests && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Special Requests:</Text>
                            <Text style={styles.infoValue}>{booking.special_requests}</Text>
                        </View>
                    )}
                </View>

                {/* All Guests Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ALL GUESTS</Text>

                    <View style={styles.guestTable}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.nameColumn}>Name</Text>
                            <Text style={styles.typeColumn}>Guest Type</Text>
                            <Text style={styles.specialColumn}>Special Needs</Text>
                        </View>

                        {/* Primary Guest */}
                        <View style={styles.tableRow}>
                            <Text style={styles.nameColumn}>{`${booking.title || ""} ${booking.first_name || ""} ${booking.last_name || ""}`}</Text>
                            <Text style={styles.typeColumn}>Primary</Text>
                            <Text style={styles.specialColumn}>{booking.special_needs || "None"}</Text>
                        </View>

                        {/* Additional Guests */}
                        {additionalGuests.map((guest, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.nameColumn}>
                                    {`${guest.title || ""} ${guest.firstName || ""} ${guest.lastName || ""}`}
                                </Text>
                                <Text style={styles.typeColumn}>Additional</Text>
                                <Text style={styles.specialColumn}>{guest.special_needs || "None"}</Text>
                            </View>
                        ))}

                        {/* Show message if no additional guests */}
                        {additionalGuests.length === 0 && (
                            <View style={styles.tableRow}>
                                <Text style={{ ...styles.nameColumn, fontStyle: 'italic' }}>No additional guests</Text>
                                <Text style={styles.typeColumn}></Text>
                                <Text style={styles.specialColumn}></Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Payment Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PAYMENT SUMMARY</Text>

                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Room Rate per Night:</Text>
                        <Text style={styles.paymentValue}>
                            {formatCurrency(
                                booking.room_rate_per_night ||
                                (booking.selling_price && nightsStay > 0
                                    ? Number(booking.selling_price) / nightsStay
                                    : 0)
                            )}
                        </Text>
                    </View>

                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Number of Nights:</Text>
                        <Text style={styles.paymentValue}>{nightsStay}</Text>
                    </View>

                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Number of Rooms:</Text>
                        <Text style={styles.paymentValue}>{booking.number_of_rooms || "1"}</Text>
                    </View>

                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Taxes and Fees:</Text>
                        <Text style={styles.paymentValue}>{formatCurrency(booking.taxes_and_fees || "0")}</Text>
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(booking.selling_price)}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Payment Status:</Text>
                        <Text style={styles.infoValue}>{booking.payment_status || "Prepaid"}</Text>
                    </View>
                </View>

                {/* Important Information */}
                <View style={styles.importantSection}>
                    <Text style={styles.importantTitle}>IMPORTANT INFORMATION</Text>

                    <View style={styles.noteItem}>
                        <View style={styles.dotPoint} />
                        <Text style={styles.noteText}>
                            Please present this itinerary along with valid photo identification at the time of check-in.
                        </Text>
                    </View>

                    <View style={styles.noteItem}>
                        <View style={styles.dotPoint} />
                        <Text style={styles.noteText}>
                            Standard check-in time is after 2:00 PM and check-out time is before 12:00 PM. Early check-in or late
                            check-out may be subject to additional charges.
                        </Text>
                    </View>

                    <View style={styles.noteItem}>
                        <View style={styles.dotPoint} />
                        <Text style={styles.noteText}>
                            The hotel may require a credit card or cash deposit for incidental charges.
                        </Text>
                    </View>

                    <View style={styles.noteItem}>
                        <View style={styles.dotPoint} />
                        <Text style={styles.noteText}>
                            All special requests are subject to availability and cannot be guaranteed. Additional charges may apply.
                        </Text>
                    </View>

                    <View style={styles.noteItem}>
                        <View style={styles.dotPoint} />
                        <Text style={styles.noteText}>
                            Please refer to your booking confirmation for specific cancellation terms and policies.
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>
                        This itinerary is valid for the specified dates only. For assistance, please contact your travel agency or the
                        hotel directly.
                    </Text>
                    <Text>Generated on: {format(new Date(), "MMMM dd, yyyy")}</Text>
                    <Text>© {new Date().getFullYear()} PHILTECH XPRESS Travels. All rights reserved.</Text>
                </View>
            </Page>
        </Document>
    );
};

export default HotelItineraryDocument;