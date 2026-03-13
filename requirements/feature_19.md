As the store Product Owner, I would like to add a feature that enables a store user to cancel an order that has not shipped yet.

1. Create the following order status types to be added on every order
1.1 Create a order status types table with order types: Ordered, Processing, Shipped, Delivered, Cancelled
1.2 Randomly update every current order in orders table to one of the status types
2. On the order listing page:
2.1 Add the order status type to the order entry
2.2 Enable the user to cancel an order only if is in the status of Ordered or Processing.
3. Order type change rule: Orders in the state of Shipped, Delivered or already Cancelled cannot change status.
4. Allow the user to save the order status change.
5. On the order detail page add a back to order listing button.

