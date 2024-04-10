<?php

// Indicate that the content type of the response is JSON
header('Content-Type: application/json');

// Enable error reporting for debugging (Turn off on production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'mudfoot.doc.stu.mmu.ac.uk';
$username = 'bahkaras';
$password = 'hirsponD3'; 
$database = 'bahkaras';

// Create a new database connection
$conn = new mysqli($host, $username, $password, $database);

// Check for connection errors
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => "Connection failed: " . $conn->connect_error]);
    exit;
}

// Read the input from the request body
$postData = json_decode(file_get_contents('php://input'), true);
$carouselItemId = isset($postData['CarouselItemID']) ? $postData['CarouselItemID'] : null;

if (null === $carouselItemId) {
    http_response_code(400);
    echo json_encode(['error' => 'CarouselItemID is required']);
    exit;
}

// SQL to delete the post based on user confirmation
$deleteSql = "DELETE FROM CarouselItems WHERE CarouselItemID = ?";
$deleteStmt = $conn->prepare($deleteSql);

// Check for errors in statement preparation
if (!$deleteStmt) {
    http_response_code(500);
    echo json_encode(['error' => $conn->error]);
    exit;
}

// Bind the carousel item ID parameter and execute the statement
$deleteStmt->bind_param("i", $carouselItemId);
if ($deleteStmt->execute()) {
    // Check for successful deletion
    if ($deleteStmt->affected_rows > 0) {
        echo json_encode(['message' => 'Post removed successfully.']);
    } else {
        echo json_encode(['message' => 'No post found or already removed.']);
    }
} else {
    // Execution failed
    http_response_code(500);
    echo json_encode(['error' => $deleteStmt->error]);
}

// Close the database connection
$deleteStmt->close();
$conn->close();
?>
