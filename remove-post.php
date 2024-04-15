<?php
// Database configuration settings
define('DB_SERVER', 'mudfoot.doc.stu.mmu.ac.uk');
define('DB_USERNAME', 'bahkaras');
define('DB_PASSWORD', 'hirsponD3');
define('DB_NAME', 'bahkaras');
define('DB_PORT', 6306);

// Connect to the MySQL database
$mysqli = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT);

// Check connection
if ($mysqli->connect_error) {
    die('Connection failed: ' . $mysqli->connect_error);
}

// Read the JSON input from the client
$input = json_decode(file_get_contents('php://input'), true);
$carouselItemId = $input['CarouselItemID'] ?? null;

if (!$carouselItemId) {
    echo json_encode(['message' => 'Invalid request: CarouselItemID is missing']);
    http_response_code(400);
    exit;
}

// Prepare a delete statement
$query = "DELETE FROM CarouselItems WHERE CarouselItemID = ?";
$stmt = $mysqli->prepare($query);

if (!$stmt) {
    echo json_encode(['message' => 'Database error: unable to prepare statement']);
    http_response_code(500);
    exit;
}

// Bind parameters
$stmt->bind_param('i', $carouselItemId);

// Execute the statement
if ($stmt->execute()) {
    // Check if any rows were affected
    if ($stmt->affected_rows > 0) {
        echo json_encode(['message' => 'Post removed successfully.']);
    } else {
        echo json_encode(['message' => 'No post found with the given ID or deletion was not necessary.']);
    }
} else {
    echo json_encode(['message' => 'Failed to remove post']);
    http_response_code(500);
}

// Close statement
$stmt->close();
// Close connection
$mysqli->close();
?>
