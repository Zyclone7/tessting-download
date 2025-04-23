import type React from "react"
import { Document, Page, Text, View, StyleSheet, Image, DocumentProps } from "@react-pdf/renderer"
import { format } from "date-fns"
import Logo from "@/public/images/XpressTravel.png";

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
  advisory: {
    fontSize: 12,
    marginBottom: 20,
  },
  flightTable: {
    marginBottom: 20,
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
  timeColumn: {
    width: "15%",
  },
  airportColumn: {
    width: "50%",
  },
  baggageColumn: {
    width: "35%",
  },
  flightDetails: {
    marginLeft: 20,
    fontSize: 12,
    color: "#666",
  },
  passengerTable: {
    marginTop: 20,
  },
  passengerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    borderBottom: 1,
    borderBottomColor: "#e5e5e5",
    fontSize: 12,
  },
  banner: {
    width: "100%",
    height: 120,
    marginVertical: 20,
  },
  reminders: {
    marginTop: 20,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  reminderText: {
    fontSize: 10,
    marginBottom: 8,
    lineHeight: 1.5,
  },
  dotPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#000",
    marginRight: 8,
    marginTop: 6,
  },
  reminderItem: {
    flexDirection: "row",
    marginBottom: 10,
  },
  flightSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
  },
})

// Helper functions
function handleFlightClass(flightClass: string): string {
  if (!flightClass) return ""
  return flightClass
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function handleAirBus(airBus: string): string {
  if (!airBus) return ""
  return airBus
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

interface ItineraryDocumentProps extends DocumentProps {
  booking: any
  airports: any
  travelLogoUrl?: string | null // Add this new prop

}

const ItineraryDocument: React.FC<ItineraryDocumentProps> = ({
  booking,
  airports,
  travelLogoUrl, // Accept the travel logo URL prop
  ...documentProps
}) => (
  <Document {...documentProps}>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerText}>Agency Name:{booking.travel_agency_name}</Text>
          <Text style={styles.headerText}>Address: {booking.travel_agency_address} Zamboanga City</Text>
          <Text style={styles.headerText}>Mobile No: {booking.contact_number_merchant} </Text>
          <Text style={styles.headerText}>Channel: PHILTECH XPRESS TRAVEL </Text>
        </View>
        <Image
          src={travelLogoUrl || Logo.src} // Use travel logo URL if available, otherwise use default
          style={styles.logo}
        />
      </View>

      {/* Booking Information */}
      <View style={styles.bookingInfo}>
        <Text style={styles.bookingReference}>Booking Reference No: {booking.reference_no}</Text>
        <Text style={styles.bookingDate}>
          Booked On: {format(new Date(booking.date_booked_request), "MMMM dd, yyyy")}
        </Text>
      </View>

      <Text style={styles.advisory}>
        We advise you print out your itinerary and take it with you to ensure your trip goes as smoothly as possible.
      </Text>

      {/* Flight Table */}
      <View style={styles.flightTable}>
        <View style={styles.tableHeader}>
          <Text style={styles.timeColumn}>Travel | DateTime</Text>
          <Text style={styles.airportColumn}>Airport Name | </Text>
          <Text style={styles.baggageColumn}>Class Baggage | Add-Ons</Text>
        </View>

        {/* Departure Flight */}
        {airports.departure && (
          <>
            <Text style={styles.flightSectionTitle}>Departure Flight</Text>
            <View style={styles.tableRow}>
              <View style={styles.timeColumn}>
                <Text>{format(new Date(booking.departure_date), "MMM dd")}</Text>
                <Text>{format(new Date(booking.departure_date), "HH:mm")}</Text>
                <Text>{`${Math.round((new Date(booking.destination_date).getTime() - new Date(booking.departure_date).getTime()) / (1000 * 60 * 60))}h`}</Text>
              </View>
              <View style={styles.airportColumn}>
                <Text>
                  {airports.departure.code} {airports.departure.name}
                </Text>
                <View style={styles.flightDetails}>
                  <Text>
                    {booking.pnr} |{" "}
                    {handleFlightClass(booking.flight_class_depart)}
                  </Text>
                </View>
              </View>
              <View style={styles.baggageColumn}>
                <Text>Checked: {booking.baggage_kilogram || 0} kg</Text>
                <Text>Carry-on: 7 Kg Included</Text>
              </View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.timeColumn}>
                <Text>{format(new Date(booking.destination_date), "MMM dd")}</Text>
                <Text>{format(new Date(booking.destination_date), "HH:mm")}</Text>
              </View>
              <View style={styles.airportColumn}>
                <Text>
                  {airports.destination.code} {airports.destination.name}
                </Text>
              </View>
              <View style={styles.baggageColumn}></View>
            </View>
          </>
        )}

        {/* Return Flight (for round-trip) */}
        {booking.type_of_travel === "round-trip" && airports.returnDeparture && (
          <>
            <Text style={styles.flightSectionTitle}>Return Flight</Text>
            <View style={styles.tableRow}>
              <View style={styles.timeColumn}>
                <Text>{format(new Date(booking.return_departure_date), "MMM dd")}</Text>
                <Text>{format(new Date(booking.return_departure_date), "HH:mm")}</Text>
                <Text>{`${Math.round((new Date(booking.return_destination_date).getTime() - new Date(booking.return_departure_date).getTime()) / (1000 * 60 * 60))}h`}</Text>
              </View>
              <View style={styles.airportColumn}>
                <Text>
                  {airports.returnDeparture.code} {airports.returnDeparture.name}
                </Text>
                <View style={styles.flightDetails}>
                  <Text>
                    {booking.pnr}|{" "}
                    {handleFlightClass(booking.flight_class_return)}
                  </Text>
                </View>
              </View>
              <View style={styles.baggageColumn}>
                <Text>Checked: {booking.baggage_kilogram || 0} kg</Text>
                <Text>Carry-on: 7 Kg Included</Text>
              </View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.timeColumn}>
                <Text>{format(new Date(booking.return_destination_date), "MMM dd")}</Text>
                <Text>{format(new Date(booking.return_destination_date), "HH:mm")}</Text>
              </View>
              <View style={styles.airportColumn}>
                <Text>
                  {airports.returnDestination.code} {airports.returnDestination.name}
                </Text>
              </View>
              <View style={styles.baggageColumn}></View>
            </View>
          </>
        )}
      </View>

      {/* Passenger Details */}
      <View style={styles.passengerTable}>
        <View style={styles.tableHeader}>
          <Text style={{ flex: 1 }}>Passengers Details</Text>
          <Text style={{ flex: 1 }}>Add-Ons</Text>
          <Text style={{ flex: 1 }}>Airline</Text>
          <Text style={{ width: 100 }}>PNR Code</Text>
        </View>
        <View style={styles.passengerRow}>
          <Text style={{ flex: 1 }}>{`${booking.title} ${booking.first_name} ${booking.last_name}`}</Text>
          <Text style={{ flex: 1 }}>-</Text>
          <Text style={{ flex: 1 }}>{booking.airbus_details_depart} </Text>
          <Text style={{ width: 100, color: "red" }}>{booking.pnr}</Text>
        </View>
      </View>

      {/* Banner */}
      {/* You can put image or another view for the banner */}

      {/* Reminders */}
      <View style={styles.reminders}>
        <Text style={styles.reminderTitle}>OTHER REMINDERS</Text>

        <View style={styles.reminderItem}>
          <View style={styles.dotPoint} />
          <Text style={styles.reminderText}>
            Passengers should arrive at the airport at least 2 hours before departure to ensure they have enough time to
            check in. During various procedures in the airport, passengers must provide the valid ID used to purchase
            their ticket. Their boarding pass or itinerary may also be required.
          </Text>
        </View>

        <View style={styles.reminderItem}>
          <View style={styles.dotPoint} />
          <Text style={styles.reminderText}>
            Please note that tickets must be used in the sequence set out in the itinerary, otherwise airlines reserve
            the right to refuse carriage. PHILTECH XPRESS Travels bears no responsibility if passengers are unable to
            board a plane due to not complying with airline policies and regulations.
          </Text>
        </View>

        <View style={styles.reminderItem}>
          <View style={styles.dotPoint} />
          <Text style={styles.reminderText}>
            Once the booking is confirmed, airline change penalties and restrictions apply. Certain tickets are
            non-refundable and non-transferable. A fee per passenger may be applied for ticket changes. Name changes or
            corrections may not be permitted.
          </Text>
        </View>
      </View>
    </Page>
  </Document>
)

export default ItineraryDocument
