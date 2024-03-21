"use client";
import React, { useState, useEffect } from "react";

const storeName = "Des Moines";
const storeMetadata = {
  storeId: "DM8",
  storeAddress: "Siddhesh Home",
};

const IndexPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [order, setOrder] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch("http://35.244.84.155:3005/api/menuItems")
      .then((response) => response.json())
      .then((data) => {
        setMenuItems(data);
        if (data && data.length > 0) {
          setSelectedItemId(data[0].id);
        }
      })
      .catch((error) => console.error("Failed to load menu items:", error));

    // Fetch completed orders
    fetch("http://35.244.84.155:3005/api/getCompletedOrders")
      .then((response) => response.json())
      .then((data) => {
        setCompletedOrders(data); // Directly setting the data as it's already in the correct format
      })
      .catch((error) =>
        console.error("Failed to load completed orders:", error)
      );
  }, []);
  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  // Function to handle items per page change
  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(+event.target.value);
    setCurrentPage(1); // Reset to first page
  };
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = completedOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
  const addItemToOrder = (itemId) => {
    const item = menuItems.find((item) => item.id === itemId);
    const existingItem = order.find((orderItem) => orderItem.id === item.id);
    if (existingItem) {
      const updatedOrder = order.map((orderItem) =>
        orderItem.id === item.id
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      );
      setOrder(updatedOrder);
    } else {
      setOrder([...order, { ...item, quantity: 1 }]);
    }
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeItemFromOrder(itemId);
      return;
    }
    const updatedOrder = order.map((item) =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setOrder(updatedOrder);
  };

  const removeItemFromOrder = (itemId) => {
    setOrder(order.filter((item) => item.id !== itemId));
  };

  const calculateTotalPrice = () => {
    return order
      .reduce((total, item) => total + item.price * item.quantity, 0)
      .toFixed(2);
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    setSubmissionStatus("");
    try {
      const response = await fetch("http://35.244.84.155:3005/api/submitOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestStartTime: Date.now(),
          items: order.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          storeMetadata,
          totalPrice: calculateTotalPrice(),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setCompletedOrders([
          // Assuming you want to add the new order to the beginning of the list
          {
            id: data.orderId,
            items: order,
            totalPrice: calculateTotalPrice(),
            latency: data.pubSubLatency,
            latency2: data.containerLatency,
            latency1: data.totalRoundTripLatency,
          },
          ...completedOrders,
        ]);
        setOrder([]);
        setSubmissionStatus("Order submitted successfully!");
        setTimeout(() => setSubmissionStatus(""), 5000);
      } else {
        setSubmissionStatus("Failed to submit the order. Please try again.");
      }
    } catch (error) {
      setSubmissionStatus("An error occurred. Please try again.");
      console.error(error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="container">
      <header>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/McDonald%27s_logo.svg/2560px-McDonald%27s_logo.svg.png"
          alt="McDonald's Logo"
          className="logo"
        />
        <h1>Welcome to {storeName} McDonald's Restaurant</h1>
      </header>
      <div className="menu-selector">
        <select
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(Number(e.target.value))}>
          {menuItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} - ${item.price}
            </option>
          ))}
        </select>
        <button onClick={() => addItemToOrder(selectedItemId)}>
          Add to Order
        </button>
      </div>
      <div className="order-summary">
        <h2>Your Order</h2>
        <ul>
          {order.map((item) => (
            <li key={item.id}>
              {item.name} x {item.quantity}
              <button
                onClick={() => updateItemQuantity(item.id, item.quantity - 1)}>
                -
              </button>
              <button
                onClick={() => updateItemQuantity(item.id, item.quantity + 1)}>
                +
              </button>
              <button
                onClick={() => removeItemFromOrder(item.id)}
                style={{ marginLeft: "10px" }}>
                🗑️
              </button>
            </li>
          ))}
        </ul>
        <p>Total: ${calculateTotalPrice()}</p>
        {!isSubmitting ? (
          <button onClick={handleSubmitOrder} disabled={order.length === 0}>
            Submit Order
          </button>
        ) : (
          <p>Submitting...</p>
        )}
        {submissionStatus && (
          <div className="submission-status">{submissionStatus}</div>
        )}
      </div>
      {completedOrders.length > 0 && (
        <div className="completed-orders">
          <h2>Completed Orders</h2>
          {completedOrders
            .sort((a, b) => b.id - a.id)
            .map((completedOrder, index) => (
              <div key={index} className="order-card">
                <p>Order ID: {completedOrder.id}</p>
                <p>
                  Items:{" "}
                  {completedOrder.items
                    .map((item) => {
                      const menuItem = menuItems.find(
                        (menuItem) => menuItem.id === item.id
                      );
                      return `${menuItem?.name || "Item"} x ${item.quantity}`;
                    })
                    .join(", ")}
                </p>
                {/* Convert totalPrice to a number and use .toFixed(2) */}
                <p>
                  Total Price: $
                  {(completedOrder.totalPrice
                    ? +completedOrder.totalPrice
                    : 0
                  ).toFixed(2)}
                </p>
                <p>UI to API Latency: {completedOrder.latency2 || "N/A"}</p>
                <p>Pub/Sub Latency: {completedOrder.latency || "N/A"}</p>
                <p>Total API Latency: {completedOrder.latency1 || "N/A"}</p>
              </div>
            ))}
          <div className="pagination-controls">
            Items per page:
            <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
              {[5, 10, 15, 20].map((number) => (
                <option key={number} value={number}>
                  {number}
                </option>
              ))}
            </select>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}>
              Prev
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(
                    prev + 1,
                    Math.ceil(completedOrders.length / itemsPerPage)
                  )
                )
              }
              disabled={
                currentPage === Math.ceil(completedOrders.length / itemsPerPage)
              }>
              Next
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: auto;
          font-family: "Helvetica Neue", Arial, sans-serif;
          color: #333;
          padding: 20px;
        }
        header {
          text-align: center;
          margin-bottom: 40px;
        }
        .logo {
          max-width: 120px;
          margin-bottom: 20px;
        }
        h1 {
          color: #d52d1e;
          font-weight: bold;
        }
        .adjust-button {
          padding: 5px 10px; // Smaller padding
          font-size: 0.8rem; // Smaller font size
        }
        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        button:hover {
          background-color: #b0241d;
        }
        .menu-selector,
        .order-summary,
        .completed-orders {
          background-color: #fff;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 2px solid #ffcc00;
        }
        button {
          background-color: #d52d1e;
          color: white;
          border: none;
          padding: 10px 20px;
          cursor: pointer;
          border-radius: 4px;
          font-weight: bold;
          margin: 5px;
        }
        button:hover {
          background-color: #b0241d;
        }
        select {
          padding: 10px;
          margin-right: 10px;
          border-radius: 4px;
          border: 1px solid #ddd;
          font-weight: bold;
        }
        ul {
          list-style: none;
          padding: 0;
        }
        li {
          margin-bottom: 5px;
          font-weight: bold;
        }
        .order-card {
          background-color: #f0f0f0;
          padding: 10px;
          margin-bottom: 10px;
          border-radius: 5px;
        }
      `}</style>
    </div>
  );
};

export default IndexPage;
