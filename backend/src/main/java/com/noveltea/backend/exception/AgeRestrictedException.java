package com.noveltea.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
 
@ResponseStatus(HttpStatus.FORBIDDEN)
public class AgeRestrictedException extends RuntimeException {
 
    public AgeRestrictedException() {
        super("Sorry, maybe when you're a bit older 😜");
    }
}