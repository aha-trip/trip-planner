// 把願望清單地點加進某一天的行程
function addWishlistItemToDay(tripId, wishlistItemId, date) {
  return db.collection("trips/" + tripId + "/itineraryItems").add({
    wishlistItemId: wishlistItemId,
    date: date,
    order: Date.now(),
    transportMode: "walk",
    durationMinutes: 60,
    travelTimeMinutes: null,
    travelDistanceMeters: null,
    travelTimeSource: "auto",
    arrivalTime: null,
    departureTime: null,
    notes: "",
    createdAt: firebase.firestore.Timestamp.now(),
  });
}
