<?php
// Fehlerprotokollierung aktivieren
error_reporting(E_ALL);
ini_set('display_errors', 1);

$servername = "10.115.2.37"; // MySQL-Server IP-Adresse
$username = "umut";          // MySQL-Benutzername
$password = "svJxuugBI&";     // MySQL-Passwort
$dbname = "filmfolio";        // Datenbankname

// Verbindung zur Datenbank herstellen
$conn = new mysqli($servername, $username, $password, $dbname);

// Überprüfen der Verbindung
if ($conn->connect_error) {
    die("Verbindung fehlgeschlagen: " . $conn->connect_error);
}

// Benutzerdaten aus dem Formular abrufen
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Überprüfen, ob der Benutzername oder die E-Mail bereits existiert
    $stmt = $conn->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    if (!$stmt) {
        die("Vorbereitung fehlgeschlagen: " . $conn->error);
    }
    $stmt->bind_param("ss", $username, $email); // "ss" für zwei Strings
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo "Benutzername oder E-Mail existiert bereits!";
    } else {
        // Passwort hashen
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // SQL-Statement zur Registrierung des neuen Benutzers
        $stmt = $conn->prepare("INSERT INTO users (username, email, password, confirmed) VALUES (?, ?, ?, ?)");
        if (!$stmt) {
            die("Vorbereitung fehlgeschlagen: " . $conn->error);
        }
        $confirmed = 0; // Standardmäßig "nicht bestätigt"
        $stmt->bind_param("sssi", $username, $email, $hashedPassword, $confirmed); // "ssi" für String, String, Integer
        if ($stmt->execute()) {
            echo "Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse.";
        } else {
            echo "Fehler bei der Registrierung: " . $stmt->error; // Zeige den Fehler an
        }
    }
}

// Verbindung schließen
$conn->close();
?>
