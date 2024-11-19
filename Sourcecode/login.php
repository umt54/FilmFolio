<?php
$servername = "10.115.2.37"; // oder die IP-Adresse deines MySQL-Servers
$username = "umut"; // oder dein MySQL-Benutzername
$password = "svJxuugBI&"; // dein MySQL-Passwort
$dbname = "filmfolio";

// Verbindung zur Datenbank herstellen
$conn = new mysqli($servername, $username, $password, $dbname);

// Überprüfen der Verbindung
if ($conn->connect_error) {
    die("Verbindung fehlgeschlagen: " . $conn->connect_error);
}

// Benutzerdaten aus dem Formular abrufen
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // SQL-Statement zur Anmeldung
    $sql = "SELECT * FROM users WHERE username='$username'";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        // Passwort überprüfen
        if (password_verify($password, $row['password'])) {
            if ($row['confirmed'] == 1) {
                echo "Anmeldung erfolgreich!";
                // Hier kannst du den Benutzer weiterleiten oder eine Sitzung starten
            } else {
                echo "Bitte bestätige deine E-Mail-Adresse, bevor du dich einloggen kannst.";
            }
        } else {
            echo "Ungültiges Passwort.";
        }
    } else {
        echo "Benutzer nicht gefunden.";
    }
}

$conn->close();
?>
