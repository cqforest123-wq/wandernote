import Foundation

/// Why no trip has reached the watch, in the wearer's language.
///
/// The glance used to print "link: activating" over "rx: none" here — true,
/// and useful to whoever wrote it, but it tells someone looking at their wrist
/// nothing they can act on. Kept separate from the view so it can be tested.
enum LinkExplanation {
    static func text(activation: String, reachable: Bool, hasReceived: Bool) -> String {
        if hasReceived {
            // The phone has talked to us; it simply has no trip to send.
            return "No trip on the phone yet. Add one in WanderNote."
        }
        if reachable {
            return "Connected. Open WanderNote on your iPhone to send a trip."
        }
        if activation == "activated" {
            return "Waiting for WanderNote on your iPhone."
        }
        return "Connecting to your iPhone…"
    }
}
