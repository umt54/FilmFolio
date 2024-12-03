<?php
$servername = "localhost"; // oder IP-Adresse des Servers
$username = "root"; // Dein MySQL-Benutzername
$password = ""; // Dein MySQL-Passwort
$dbname = "filmfolio"; // Deine Datenbank

// Verbindung zur Datenbank herstellen
$conn = new mysqli($servername, $username, $password, $dbname);

// Verbindung überprüfen
if ($conn->connect_error) {
    die("Verbindung fehlgeschlagen: " . $conn->connect_error);
}

// Benutzereingaben aus dem Formular
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $conn->real_escape_string($_POST['username']);
    $email = $conn->real_escape_string($_POST['email']);
    $password = $_POST['password'];
    $password_confirm = $_POST['password_confirm'];

    // Passwortbestätigung überprüfen
    if ($password !== $password_confirm) {
        echo "Die Passwörter stimmen nicht überein!";
        exit();
    }

    // Passwort hashen
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // SQL-Abfrage zur Überprüfung, ob der Benutzer bereits existiert
    $sql = "SELECT * FROM users WHERE username='$username' OR email='$email'";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        echo "Benutzername oder E-Mail ist bereits vergeben!";
    } else {
        // SQL-Abfrage zur Benutzerregistrierung
        $sql = "INSERT INTO users (username, email, password, created_at) 
                VALUES ('$username', '$email', '$hashed_password', NOW())";

        if ($conn->query($sql) === TRUE) {
            echo "Registrierung erfolgreich! Du kannst dich jetzt einloggen.";
            // Redirect zur Login-Seite oder zu einer Bestätigungsseite
            header("Location: login.html");
        } else {
            echo "Fehler bei der Registrierung: " . $conn->error;
        }
    }
}

$conn->close();
?>
