package com.mtools.api.echo.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EchoController {

	@GetMapping("/api/echo")
	public Map<String, String> echo(@RequestParam String id) {
		return Map.of("id", id);
	}
}
