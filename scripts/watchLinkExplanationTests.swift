import Foundation

func assert(_ condition: @autoclosure () -> Bool, _ message: String) {
    if !condition() { fatalError(message) }
}

@main
struct WatchLinkExplanationTests {
    static func main() {
        testNoDeveloperJargonInAnyState()
        testReceivedButEmptyTellsTheWearerWhereToAdd()
        testReachableAsksThemToOpenThePhoneApp()
        testActivatedButUnreachableSaysWaiting()
        testStartingSaysConnecting()
        print("watch link explanation tests passed")
    }

    /// The reason this exists: a reviewer, and a wearer, saw "link: activating".
    static func testNoDeveloperJargonInAnyState() {
        let states = [
            LinkExplanation.text(activation: "starting", reachable: false, hasReceived: false),
            LinkExplanation.text(activation: "activated", reachable: false, hasReceived: false),
            LinkExplanation.text(activation: "activated", reachable: true, hasReceived: false),
            LinkExplanation.text(activation: "activated", reachable: true, hasReceived: true),
        ]
        for s in states {
            assert(!s.contains("link:"), "developer string leaked: \(s)")
            assert(!s.contains("rx:"), "developer string leaked: \(s)")
            assert(!s.lowercased().contains("activation"), "developer string leaked: \(s)")
            assert(s.first.map { $0.isUppercase } ?? false, "should read as a sentence: \(s)")
        }
    }

    static func testReceivedButEmptyTellsTheWearerWhereToAdd() {
        let s = LinkExplanation.text(activation: "activated", reachable: true, hasReceived: true)
        assert(s.contains("Add one"), s)
    }

    static func testReachableAsksThemToOpenThePhoneApp() {
        let s = LinkExplanation.text(activation: "activated", reachable: true, hasReceived: false)
        assert(s.contains("Open WanderNote"), s)
    }

    static func testActivatedButUnreachableSaysWaiting() {
        let s = LinkExplanation.text(activation: "activated", reachable: false, hasReceived: false)
        assert(s.contains("Waiting"), s)
    }

    static func testStartingSaysConnecting() {
        let s = LinkExplanation.text(activation: "starting", reachable: false, hasReceived: false)
        assert(s.contains("Connecting"), s)
    }
}
