<? php
 if ( isset ( $_POST [ 'Email' ])) { // EDYTUJ 2 LINIE PONIŻEJ JAKO WYMAGANE 
    $email_to = "kontakt.dajsonek@gmail.com" ; 
    $email_subject = "Nowe przesyłanie formularzy" ; function problem ( $error ) { 
        echo "Bardzo nam przykro, ale zostały znalezione błędy w przesłanym formularzu." ; 
        echo "Te błędy pojawiają się poniżej.<br><br>" ; 
        echo $błąd . "<br><br>" ;  

      

    
     "Wróć i napraw te błędy.<br><br>" ; umierać (); } // sprawdzanie poprawności oczekiwanych danych istnieje jeśli ( ! isset ( $_POST [ 'Name' ]) || ! isset ( $_POST [ 'Email' ]) || ! isset ( $_POST [ 'Message' ] ) ) { 
        problem ( 'Przepraszamy, ale wygląda na to, że wystąpił problem z przesłanym formularzem.' ); } 
    $nazwa = $_POST [ 'Nazwa'
        
    

    
     
         
         
        
     
    
]; // wymagany 
    $email = $_POST [ 'Email' ]; // wymagana 
    $wiadomość = $_POST [ 'Wiadomość' ]; // wymagane 
    $error_message = "" ; 
    $email_exp = '/^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/' ; if (! preg_match ( $email_exp , $email )) { 
        $error_message .= 'Wprowadzony adres e-mail nie wydaje się być prawidłowy.<br>' ; } 
    $string_exp =   
  

       
    
 "/^[A-Za-z .'-]+$/" ; if (! preg_match ( $string_exp , $name )) { 
        $error_message .= 'Wprowadzona nazwa nie jest prawidłowa.<br>' ; } if ( strlen ( $message ) < 2 ) { 
        $error_message .= 'Wprowadzona wiadomość nie wydaje się być prawidłowa.<br>' ; } if ( strlen ( $ komunikat o błędzie ) > 0 ) { 
        problem (

       
    

         
    

        $ komunikat_błędu ); } 
    $email_message = "Szczegóły formularza poniżej.\n\n" ; function clean_string ( $string ) { 
        $bad = array ( "content-type" , "bcc:" , "to:" , "cc:" , "href" ); return str_replace ( $bad , "" , $string ); } 
    $email_message .= "Nazwa: " .
    
 

    
        
         
    
    "\n" ; 
    $email_message .= "E-mail: " . clean_string ( $ e - mail ) . "\n" ; 
    $email_message .= "Wiadomość: " . clean_string ( $ wiadomość ) . "\n" ; // utwórz nagłówki wiadomości e-mail 
    $headers = 'Od:' . $e-mail . "\r\n" . „Odpowiedź do:” . $e-mail . "\r\n" . 'X-Mailer: PHP/' . wersja php ();        

        
           
         
    $email_do , $email_temate , $ email_message , $nagłówki ); ?> <!-- poniżej umieść swoją wiadomość o sukcesie --> 
    Dziękujemy za skontaktowanie się z nami. Wkrótce skontaktujemy się z Tobą. <? php
 } ?>


    

