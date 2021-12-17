pragma circom 2.0.2;

/*This circuit template checks that c is the multiplication of a and b.*/  

template DigitReader (n) {  

   // Declaration of signals.  
   signal input image[n];  
   signal output digit;  

   // Constraints.  
   digit <== image[0] * image[1];  
}

 component main = DigitReader(3);
