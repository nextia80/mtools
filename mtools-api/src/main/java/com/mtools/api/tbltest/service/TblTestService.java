package com.mtools.api.tbltest.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.mtools.api.tbltest.dao.TblTestDao;

@Service
public class TblTestService {

	private final TblTestDao tblTestDao;

	public TblTestService(TblTestDao tblTestDao) {
		this.tblTestDao = tblTestDao;
	}

	public List<Map<String, Object>> findAll() {
		return tblTestDao.findAll();
	}
}
