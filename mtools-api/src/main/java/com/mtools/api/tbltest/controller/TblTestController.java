package com.mtools.api.tbltest.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mtools.api.tbltest.service.TblTestService;

@RestController
public class TblTestController {

	private final TblTestService tblTestService;

	public TblTestController(TblTestService tblTestService) {
		this.tblTestService = tblTestService;
	}

	@GetMapping("/api/tbl-test")
	public List<Map<String, Object>> tblTest() {
		return tblTestService.findAll();
	}
}
