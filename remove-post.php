<?php

// Indicate that the content type of the response is JSON
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'http://sql8.freemysqlhosting.net';
$username = 'sql8689226';
$password = 'SlU4NVg6gD'; // Note: Be cautious with passwords in scripts.
$database = 'sql8689226';

// Create a new database connection
$conn = new mysqli($host, $username, $password, $database);

// Check for connection errors
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Read the input from the request body
$postData = json_decode(file_get_contents('php://input'), true);
$carouselItemId = $postData['CarouselItemID'];

// SQL to delete the post based on user confirmation
$deleteSql = "DELETE FROM CarouselItems WHERE CarouselItemID = ?";
$deleteStmt = $conn->prepare($deleteSql);

// Check for errors in statement preparation
if (!$deleteStmt) {
    echo json_encode(['error' => $conn->error]);
    exit;
}

// Bind the carousel item ID parameter and execute the statement
$deleteStmt->bind_param("i", $carouselItemId);
$deleteStmt->execute();

// Check for errors in statement execution
if ($deleteStmt->error) {
    echo json_encode(['error' => $deleteStmt->error]);
} else if ($deleteStmt->affected_rows > 0) {
    echo json_encode(['message' => 'Post removed successfully.']);
} else {
    echo json_encode(['message' => 'No post found or already removed.']);
}

// Close the database connection
$deleteStmt->close();
$conn->close();
?>
