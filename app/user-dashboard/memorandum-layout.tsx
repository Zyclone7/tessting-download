"use client";
import { useState } from "react";
import { useUserContext } from "@/hooks/use-user";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  PDFViewer,
  Image,
} from "@react-pdf/renderer";

interface MoaLayotProps {
  signatureImage: string | null;
}

const MoaLayot = ({ signatureImage }: MoaLayotProps) => {
  const [imageURL, setImageURL] = useState(null);
  const { user } = useUserContext();
  const currentDate = new Date();
  console.log(imageURL);
  const styles = StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: "#ffffff",
      paddingTop: 40,
      paddingBottom: 40,
      width: "100%",
      height: "100%",
      boxSizing: "border-box",
    },
    body: {
      paddingTop: 35,
      paddingBottom: 65,
      paddingHorizontal: 35,
    },
    title: {
      marginTop: 20,
      fontSize: 16,
      textAlign: "center",
      fontFamily: "Times-Roman",
      color: "#000000",
    },
    subtitle: {
      fontSize: 12,
      marginTop: 10,
      marginBottom: 15,
      marginHorizontal: 20,
      textAlign: "left",
      fontFamily: "Times-Roman",
      color: "#444444",
    },
    text: {
      paddingHorizontal: 12,
      marginHorizontal: 12,
      marginVertical: 10,
      fontSize: 12,
      textAlign: "justify",
      lineHeight: 1.5,
      fontFamily: "Times-Roman",
      color: "#333333",
    },
    author: {
      fontSize: 12,
      textAlign: "center",
      marginBottom: 40,
    },
    image: {
      marginVertical: 15,
      marginHorizontal: 100,
    },
    header: {
      fontFamily: "Times-Roman",
      fontSize: 12,
      marginBottom: 20,
      textAlign: "center",
      color: "#333333",
    },
    pageNumber: {
      position: "absolute",
      fontSize: 12,
      bottom: 30,
      left: 0,
      right: 0,
      textAlign: "center",
      color: "grey",
    },
    listItem: {
      fontSize: 12,
      marginVertical: 4,
      marginHorizontal: 20,
      textAlign: "left",
      fontFamily: "Times-Roman",
    },
    alphabet: {
      marginRight: 5,
    },
    listContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    mainItem: {
      fontSize: 12,
      marginBottom: 5,
    },
    nestedList: {
      marginLeft: 15,
      marginBottom: 5,
    },
    nestedItem: {
      fontSize: 12,
      marginBottom: 3,
    },
    section: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      textAlign: "left",
      paddingHorizontal: 12,
      marginHorizontal: 12,
      marginVertical: 30,
    },
    item_col: {
      fontSize: 12,
      textAlign: "justify",
      lineHeight: 1.5,
      fontFamily: "Times-Roman",
      color: "#333333",
    },
    line: {
      flexDirection: "row",
      alignContent: "center",
      justifyContent: "center",
      textAlign: "center",
      paddingHorizontal: 50,
    },
    center: {
      fontSize: 12,
      textAlign: "center",
      lineHeight: 1.5,
      fontFamily: "Times-Roman",
      color: "#333333",
    },
  });
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(currentDate);

  const currentDay = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
  });

  return (
    <PDFViewer width="100%" height="500px">
      <Document>
        <Page size="LEGAL" style={styles.page}>
          <Text style={styles.title}>
            ELITE PLUS DISTRIBUTOR MEMORANDUM OF AGREEMENT
          </Text>
          <Text style={styles.subtitle}>KNOW ALL MEN BY THESE PRESENT:</Text>
          <Text style={styles.text}>
            This Elite Plus Distributor Memorandum of Agreement ("MOA"), made
            and entered into this day of {currentDay} {""} in
            {""} {formattedDate.toUpperCase()}, between and among:
          </Text>
          <Text style={styles.text}>
            {user?.nickname} of legal age, Filipino and a resident of{" "}
            {user?.business_address || "Not Provided"}, herein referred to as
            the "ELITE PLUS DISTRIBUTOR"and
          </Text>
          <Text style={styles.text}>
            PHILTECH, INC. a corporation duly organized and existing under and
            by virtue of the laws of the Republic of the Philippines and is
            registered under the Securities and Exchange Commission, with
            principal place of business at Gallera Road, Barangay Guiwan,
            Zamboanga City, Philippines, herein after referred to as the
            "FRANCHISOR;"
          </Text>
          <Text style={styles.text}>
            WHEREAS, the FRANCHISEE MERCHANT, which is engaged in the business
            of {user?.business_name || "Not Provided"}, is selected by PHILTECH,
            INC. to be a distributor of the PHILTECH NEGOSYO Packages with ATM
            GO Device/s;
          </Text>
          <Text style={styles.text}>
            WHEREAS, PHILTECH, INC. is a franchise business package provider and
            offers multiple services with ATM Withdrawal Device/s to
            Distributor;
          </Text>
          <Text style={styles.text}>
            NOW, THEREFORE, in consideration of the mutual covenants contained
            herein and other valuable considerations, the parties agree as
            follows:
          </Text>
          <Text style={styles.header}>
            I. RESPONSIBILITIES AND OBLIGATIONS OF THE PARTIES
          </Text>
          <Text style={styles.subtitle}>PHILTECH, INC (FRANCHISOR):</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
            fixed
          />
          {[
            "PHILTECH, INC., shall provide for a PHILTECH DISTRIBUTOR PACKAGE to the ELITE PLUS DISTRIBUTOR; ",
            "PHILTECH, INC., shall provide an ATM WITHDRAWAL Device (ATM GO Device) free of use, along with an Xpress Travel System, Free Multiple ATM Devices, Free 4 Units TV Boxes, XPRESSLOAD All-in-one System, and other services which is included in every DISTRIBUTOR PACKAGE;",
            "PHILTECH, INC., shall provide a firsthand support to all its services, which are not limited to ATM withdrawals, package referrals, and XPRESSLOAD Systems;",
            "PHILTECH, INC., shall provide a Referral Incentive Program, Referral Passive Income, and Multiple Passive/Transaction to ELITE PLUS DISTRIBUTOR;",
            "PHILTECH, INC., shall provide for any and all marketing and/or advertising materials to the ELITE PLUS DISTRIBUTOR;",
            "PHILTECH, INC., shall assist in explaining the Negosyo Package, and its policies, including the demonstration of how to use the ATM GO Device to the ELITE PLUS DISTRIBUTOR and his/her referral merchant;",
            "PHILTECH, INC., shall provide a free Business Training and Coaching to the ELITE PLUS DISTRIBUTOR.",
            "PHILTECH, INC. shall provide a 15% discount for every Premium Package availed by ELITE PLUS DISTRIBUTORS referred merchant.",
          ].map((item, index) => (
            <Text key={index} style={styles.text}>
              {`${String.fromCharCode(97 + index)}. ${item}`}
            </Text>
          ))}
          <Text style={styles.subtitle}>ELITE PLUS DISTRIBUTOR:</Text>
          {[
            "ELITE PLUS DISTRIBUTOR, shall agree to a one-time initial franchise fee of the ELITE PLUS DISTRIBUTOR PACKAGE with multiple services from PHILTECH, INC.;",
            "ELITE PLUS DISTRIBUTOR, shall agree to submit and complete all the necessary business requirements as provided by PHILTECH, INC. before the onboarding of said distributor;",
            "ELITE PLUS DISTRIBUTOR, should avail of, any of the packages given by PHILTECH, INC., such package entered into and paid is NON-REFUNDABLE;",
            "ELITE PLUS DISTRIBUTOR, shall guide and motivate their merchants to use and transact using the ATM Withdrawals Device, products and/or services provided by PHILTECH, INC.;",
            "ELITE PLUS DISTRIBUTOR, shall agree to deploy all the devices he/she has within their possession to different merchants within the Philippines;",
            "ELITE PLUS DISTRIBUTOR, shall submit and complete all the necessary requirements of its referred merchant to PHILTECH or any of respective agents or representatives;",
            "ELITE PLUS DISTRIBUTOR, is prohibited from altering the price of the packages without prior written memorandum or notice from PHILTECH, INC.;",
            "ELITE PLUS DISTRIBUTOR, shall agree that they CANNOT transfer or assign any Franchise Negosyo Package, including the ATM GO Device to any individual, firm or corporation, without approval from PHILTECH, INC., except, if the person is included within his/her immediate family, within the first (1st) degree of consanguinity or affinity;",
            "ELITE PLUS DISTRIBUTOR, shall agree that he/she is PROHIBITED from, renting and/or selling the ATM GO Device to any individual, firm or corporation for whatsoever reason; ",
            "ELITE PLUS DISTRIBUTOR, acknowledges that the ATM GO Device/s is merely an add-on or additional service to the FRANCHISE PACKAGE and is not part of the purchased franchise, and that he/she DOES NOT own the system and/or device, it is FREE TO USE ONLY. Ownership of system and ATM GO Device is by PHILTECH & RCBC.;",
            "ELITE PLUS DISTRIBUTOR, shall report and coordinate with the Operations, Accounting, and Compliance Department of PHILTECH, INC. for any concerns and/or issues in relation to its services and device;",
            "ELITE PLUS DISTRIBUTOR, shall agree and encourage his/her merchant to acquire any number of thermal papers from PHILTECH, INC. to avoid substandard quality and to make sure for the long-term use of the ATM GO Device with proper charges and fees imposed by PHILTECH, INC.",
          ].map((item, index) => (
            <Text key={index} style={styles.text}>
              {`${String.fromCharCode(97 + index)}. ${item}`}
            </Text>
          ))}
          <Text style={styles.header}>II. PERFORMANCE REVIEW</Text>
          {[
            "The ELITE PLUS DISTRIBUTOR, shall be tagged as inactive, if he/she has failed to make any transaction or referred any merchants within at least three (3) consecutive months; ",
            "The ELITE PLUS DISTRIBUTOR, should fail to submit and complete all of the necessary requirements of his/her referral merchant before activation within at least thirty (30) days with PHILTECH, INC., such referral merchant's ATM GO Device will not be subject for activation and that such device will be subject for pull-out; and",
            "The ELITE PLUS DISTRIBUTOR shall maintain and take careful care of the ATM GO Device/s while in his/her possession at all times.",
          ].map((item, index) => (
            <Text key={index} style={styles.text}>
              {`${String.fromCharCode(97 + index)}. ${item}`}
            </Text>
          ))}
          <Text style={styles.header}>
            III. DEFECTIVE TERMINALS, WARRANTY, AND MAINTENANCE SERVICES
          </Text>
          {[
            "The ATM GO terminal warranty is valid for a lifetime, so long as it is actively transacting;",
            "All costs related to the repairs, maintenance, and/or replacement of the ATM GO Terminal, including but not limited to ordinary wear and tear, shall be for the account of PHILTECH, INC., except for damages that can be traced to the fault and/or negligence of the ELITE PLUS DISTRIBUTOR, its employees, agents and/or representatives, in which case the ELITE PLUS DISTRIBUTOR shall shoulder such costs. ",
          ].map((item, index) => (
            <Text key={index} style={styles.text}>
              {`${String.fromCharCode(97 + index)}. ${item}`}
            </Text>
          ))}
          <Text style={styles.header}>IV. SUSPENSION OF THE SERVICES</Text>
          <Text style={styles.text}>
            The ELITE PLUS DISTRIBUTOR acknowledges that PHILTECH, INC. without
            need of prior notice, has the right to immediately suspend the
            access to the franchise, or any provision of the services, in the
            event that the ELITE PLUS DISTRIBUTOR is in breach of its
            obligations under this Agreement.
          </Text>
          <Text style={styles.header}>V. TERM, PERIOD and TERMINATION</Text>
          <Text style={styles.text}>
            This Agreement may be terminated by a mutual consent of both
            PARTIES. Such notice of termination shall be in writing. However,
            any PARTY may terminate this Agreement by giving the other PARTY a
            notice in writing not less than sixty (60) days thereof.
            Furthermore, such Agreement may also be terminated if either PARTY
            violates the contents, terms, conditions, and/or provisions of this
            Agreement and other analogous circumstances.
          </Text>
          <Text style={styles.header}>
            VI. DISTRIBUTOR REFERRAL SYSTEM & PASSIVE INCOME
          </Text>
          {/* List Item 'a' */}
          <Text style={styles.subtitle}>
            A. The ELITE PLUS DISTRIBUTOR shall receive a referral commission
            based on the package availed by his/her referral merchant. Which
            will be as follows:
          </Text>
          <View>
            <View style={styles.text}>
              <Text style={styles.nestedItem}>
                {"  "} - Distributor referred availing the Basic Package, the
                ELITE PLUS DISTRIBUTOR will receive at least Php750.00 after
                activation of merchant referral;
              </Text>
              <Text style={styles.nestedItem}>
                {"  "} - Distributor referred availing the Premium Package, the
                ELITE PLUS DISTRIBUTOR will receive at least Php1,500.00 after
                activation of merchant referral;
              </Text>
              <Text style={styles.nestedItem}>
                {"  "} - Distributor referred availing the Elite Distributor
                Package, the ELITE PLUS DISTRIBUTOR will receive at least
                Php5,000.00 after activation of merchant referral;
              </Text>
              <Text style={styles.nestedItem}>
                {"  "} - Distributor referred availing the Elite Plus
                Distributor Package, the ELITE PLUS DISTRIBUTOR will receive at
                least Php10,000.00 after activation of merchant referral.
              </Text>
            </View>

            {/* List Item 'b' */}
            <Text style={styles.text}>
              b. The ELITE PLUS DISTRIBUTOR will receive a Generation Bonus
              Passive Income, which is based on the ELITE PLUS DISTRIBUTOR's 2nd
              to 10th Generation merchant referrals. Which is further indicated
              under ANNEX "A";
            </Text>

            {/* List Item 'c' */}
            <Text style={styles.text}>
              c. The ELITE PLUS DISTRIBUTOR will also receive a Php3.00 from ATM
              & Other Products Transaction Passive Income, which is based on the
              ATM transactions made by the ELITE PLUS DISTRIBUTOR's 1st to 10th
              Generation merchant referrals. Also, ELITE DISTRIBUTOR will
              receive a rate 15% rebate per voucher from Other Products Sold
              (i.e. Xpress TV & Xpress Wi-Fi Vouchers Sold);
            </Text>
            <Text style={styles.text}>
              d. DISTRI-to-DISTRI Passive Income. The ELITE PLUS DISTRIBUTOR
              will receive a passive income based on the ATM Withdrawal
              Transaction and rebates from Other Products Sold by his/her
              Distributor Referrals who have avail the same Elite Distributor
              Package. For ATM Withdrawal Transactions the ELITE PLUS
              DISTRIBUTOR will receive Php1.00 per Merchant ATM Transaction from
              his/her 1st and 2nd Level Groups Distributors. As for rebates from
              Other Products Sold (i.e. Xpress TV & Xpress Wi-Fi Vouchers Sold)
              a rate of 2.5% rebate per voucher sold will be received by ELITE
              PLUS DISTRIBUTOR.
            </Text>
            <Text style={styles.header}>
              VII. INDEMNIFICATION AND LIABILITIES
            </Text>
            <Text style={styles.text}>
              The PARTIES shall have no liability to the other for any loss
              suffered, which arises of any act and/or omission, if any, in good
              faith, that such course of conduct was in the best interests of
              this Agreement and such course of conduct did not constitute any
              gross negligence or willful misconduct made by either PARTY.
              However, PARTIES shall each be indemnified by the other for
              losses, liabilities, damages, and/or expenses sustained by it in
              connection with this Agreement.
            </Text>
            <Text style={styles.header}>VIII. SEPARABILITY CLAUSE</Text>
            <Text style={styles.text}>
              If any of the provision(s) under this Agreement be declared
              invalid or unenforceable by any competent court, the validity and
              enforceability of the other provisions hereof shall not be
              affected or impaired.
            </Text>
            <Text style={styles.header}>
              IX. CONFIDENTIALITY AND DISCLOSURE
            </Text>
            {[
              "The ELITE PLUS DISTRIBUTOR, without prior consent of the merchant/customer, use or disclose any information regarding his/her personal information and/or transaction, howsoever obtained and in whatsoever form the information shall take, to any third party unless such disclosure is compelled by law;",
              "The ELITE PLUS DISTRIBUTOR will not, without prior consent from PHILTECH to use or disclose any information howsoever obtained and in whatsoever form on the business of PHILTECH or the System or this Agreement, to any third party, unless such disclosure is required by law; and",
              "The PARTIES shall comply, in good faith, with the provisions of the Data Privacy Act of 2012 (DPA), its implementing Rules and Regulations, and all other pertinent issuances of the National Privacy Commission. In compliance with confidentiality and non-disclosure shall remain even after the end of the term of this Agreement. All information and data acquired during the existence of this Agreement shall be returned vice versa, within a reasonable time upon the termination of this Agreement.",
            ].map((item, index) => (
              <Text key={index} style={styles.text}>
                {`${String.fromCharCode(97 + index)}. ${item}`}
              </Text>
            ))}
            <Text style={styles.header}>
              X. DISPUTE RESOLUTION, GOVERNING LAW AND VENUE
            </Text>
            <Text style={styles.text}>
              Any dispute, claim, or controversy which may arise from or in
              connection with this Agreement shall be settled amicably between
              the PARTIES within thirty (30) days from receipt of notice by one
              party from the other. In the event, the same remains unresolved
              after the said period, it shall be referred to mediation. The
              costs shall be equally borne by the PARTIES. In the event that a
              Court action is necessary, such action shall be filed only before
              the proper and competent courts of Zamboanga City, to the
              exclusion of other venues.
            </Text>
            <Text style={styles.text}>
              IN WITNESS WHEREOF, the PARTIES, through their duly authorized
              representatives have signs this agreement on the date below.
            </Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.item_col}>
              Arnold A. ARBILLERA {"\n"}
              CEO and President PHILTECH,INC {"\n"}
              Date:__________________
            </Text>
            <Text style={styles.item_col}>
              √_________________________{"\n"}
              Ellite Plus Distributor
              {"\n"}
              Date: __________________
            </Text>
          </View>
          <Text style={styles.header}>Signed in the presence of:</Text>

          <View style={styles.section}>
            <Text style={styles.line}>__________________</Text>
            <Text style={styles.line}>__________________</Text>
          </View>
          <Text style={styles.header}>ACKNOWLEDGMENT</Text>
          <Text style={styles.subtitle}>
            REPUBLIC OF THE PHILLIPPINES){"\n"}
            ______________________ ) S.S
          </Text>
          <Text style={styles.subtitle}>
            BEFORE ME, a Notary Public for and in the City of Zamboanga, this
            ___ day of ____________, affiants personally appeared:
          </Text>
          <View style={styles.section}>
            <Text style={styles.center}>
              Name{"\n"}
              ARNOLD A. ARBILLERA{"\n"}
              _________________________
            </Text>
            <Text style={styles.text}>
              Identification Card Presented{"\n"}
              _________________________{"\n"}
              _________________________
            </Text>
            <Text style={styles.center}>
              Date Issue{"\n"}
              _____________{"\n"}
              _____________
            </Text>
          </View>
          <Text style={styles.text}>
            known to me to be the same person who personally signed before me
            the foregoing Memorandum of Agreement and they acknowledged that the
            same are their free act and deed.
          </Text>
          <Text style={styles.text}>
            This Agreement consist of four (4) pages, including this page on
            which this acknowledgment is written, duly signed by the PARTIES'
            authorized representative and their witnesses on the spaces provided
            for their signatures.
          </Text>
          <Text style={styles.center}>
            IN WITNESS WHEREOF, I have hereunto set my hand and affixed my seal
            on the date earlier stated.
          </Text>
          <Text style={styles.subtitle}>
            Doc. No. _________{"\n"}
            Page No. _________{"\n"}
            Book No. _________{"\n"}
            Series of 2024. {"\n"}
          </Text>
          <Text>
            {signatureImage ? (
              <Image
                src={signatureImage || "/placeholder.svg"}
                style={{
                  width: 150,
                  height: 75,
                }}
              />
            ) : null}
          </Text>
        </Page>
      </Document>
    </PDFViewer>
  );
};

export default MoaLayot;